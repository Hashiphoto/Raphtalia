import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import GuildStoreService from "../../services/message/GuildStore.service";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import RaphError from "../../models/RaphError";
import { Result } from "../../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Store extends Command<ICommandProps> {
  public constructor(private _guildStoreService?: GuildStoreService) {
    super();
    this.name = "Store";
    this.instructions = "Post the server store in this channel";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    if (!this.channel || !((this.channel as TextChannel)?.type === "GUILD_TEXT")) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._guildStoreService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._guildStoreService?.postEmbed(this.channel as TextChannel);

    return 1;
  }
}
