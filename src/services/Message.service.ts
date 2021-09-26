import delay from "delay";
import {
  Client,
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  TextChannel,
  User as DsUser,
} from "discord.js";
import { delay as tsDelay, inject, injectable } from "tsyringe";
import CommmandMessage from "../models/CommandMessage";
import CensorshipService from "./Censorship.service";
import ChannelService from "./Channel.service";
import ClientService from "./Client.service";
import CommandService from "./Command.service";
import CurrencyService from "./Currency.service";

@injectable()
export default class MessageService {
  private _client: Client;

  public constructor(
    @inject(tsDelay(() => ClientService)) private _clientService: ClientService,
    @inject(ChannelService) private _channelService: ChannelService,
    @inject(tsDelay(() => CommandService)) private _commandService: CommandService,
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
      message.type === "CHANNEL_PINNED_MESSAGE"
    ) {
      await message.delete();
      return;
    }

    // Unhandlded cases
    if (
      message.channel.type === "DM" ||
      message.type !== "DEFAULT" ||
      message.channel.type === "GUILD_NEWS" ||
      !message.guild
    ) {
      return;
    }

    // Delete the incoming message
    let deleteTime = await this._channelService.getDeleteTime(message.channel);
    if (message.author.bot) {
      deleteTime *= 2;
    }
    this.delayedDelete(message, deleteTime);

    // Process command
    if (message.content.startsWith(CommmandMessage.COMMAND_PREFIX)) {
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

  public async handleReactionAdd(
    messageReaction: MessageReaction | PartialMessageReaction,
    user: DsUser | PartialUser
  ): Promise<void> {
    const message = messageReaction.message.partial
      ? await messageReaction.message.fetch()
      : messageReaction.message;
    if (!user || !(message.channel instanceof TextChannel) || !message.guild) {
      return;
    }
    // Only pay users for their first reaction to a message
    if (message.reactions.cache.filter((e) => !!e.users.cache.get(user.id)).size > 1) {
      return;
    }
    const guildMember = message.guild.members.cache.get(user.id);
    if (!guildMember) {
      return;
    }
    this._currencyService.payoutReaction(guildMember, message);
  }

  public async handleReactionRemove(
    messageReaction: MessageReaction | PartialMessageReaction,
    user: DsUser | PartialUser
  ): Promise<void> {
    const message = messageReaction.message.partial
      ? await messageReaction.message.fetch()
      : messageReaction.message;
    if (!user || !(message.channel instanceof TextChannel) || !message.guild) {
      return;
    }
    // Only subtract money for removing the user's only remaining reaction
    if (message.reactions.cache.filter((r) => !!r.users.cache.get(user.id)).size > 0) {
      return;
    }
    const guildMember = message.guild.members.cache.get(user.id);
    if (!guildMember) {
      return;
    }
    this._currencyService.payoutReaction(guildMember, message, true);
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
      // Message no longer exists
      if (error.name === "DiscordAPIError" && error.message === "Unknown Message") {
        return;
      }
      throw error;
    });
  }
}
