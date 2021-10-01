import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import GuildStoreService from "../services/message/GuildStore.service";
import Command from "./Command";

@autoInjectable()
export default class Store extends Command {
  public constructor(private _guildStoreService?: GuildStoreService) {
    super();
    this.name = "Store";
    this.instructions = "Post the server store in this channel";
    this.usage = "`Store`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<number | undefined> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._guildStoreService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._guildStoreService?.postEmbed(this.channel);

    return 1;
  }
}
