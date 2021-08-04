import delay from "delay";
import { Client, Message } from "discord.js";
import { inject, injectable } from "tsyringe";
import CensorshipService from "./Censorship.service";
import ChannelService from "./Channel.service";
import ClientService from "./Client.service";
import CommandService from "./Command.service";
import CommandParser from "./CommandParser";
import CurrencyService from "./Currency.service";

@injectable()
export default class MessageService {
  private _client: Client;

  public constructor(
    @inject(ClientService) private _clientService: ClientService,
    @inject(ChannelService) private _channelService: ChannelService,
    @inject(CommandService) private _commandService: CommandService,
    @inject(CurrencyService) private _currencyService: CurrencyService,
    @inject(CensorshipService) private _censorshipService: CensorshipService
  ) {
    this._client = this._clientService.getClient();
  }

  /**
   * Process a guild member's channel message
   */
  public async handleMessage(message: Message): Promise<void> {
    // Delete the "Raphtalia has pinned a message to this channel" message
    if (
      this._client.user &&
      this._client.user.id === message.author.id &&
      message.type === "PINS_ADD"
    ) {
      await message.delete();
      return;
    }

    // Unhanlded cases
    if (
      message.author.bot ||
      message.channel.type === "dm" ||
      message.type !== "DEFAULT" ||
      message.channel.type === "news" ||
      !message.guild
    ) {
      return;
    }

    // Delete the incoming message
    const deleteTime = await this._channelService.getDeleteTime(message.channel);
    this.delayedDelete(message, deleteTime);

    // Process command
    if (message.content.startsWith(CommandParser.COMMAND_PREFIX)) {
      await this._commandService.processMessage(message);
      await this._currencyService.payoutMessageAuthor(message);
    }
    // Censor non-commands
    else {
      const censored = await this._censorshipService.censorMessage(message);
      if (!censored) {
        await this._currencyService.payoutMessageAuthor(message);
      }
    }
  }

  /**
   * Delete a message after a delay
   */
  private async delayedDelete(message: Message, timeMs: number) {
    if (timeMs < 0) {
      return;
    }
    await delay(timeMs);
    message.delete().catch((error) => {
      // Message was manually deleted
      if (error.name === "DiscordAPIError" && error.message === "Unknown Message") {
        return;
      }
      throw error;
    });
  }
}
