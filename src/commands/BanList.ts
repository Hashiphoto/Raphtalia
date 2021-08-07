import BanListService from "../services/message/BanWordList.service";
import Command from "./Command";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import { GuildMember } from "discord.js";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class BanList extends Command {
  public constructor(private _banListService?: BanListService) {
    super();
    this.instructions = "**BanList**\nPost the Banned Words List in this channel";
    this.usage = "Usage: `BanList`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member);
  }

  public async execute(initiator: GuildMember): Promise<void> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._banListService?.removeMessage();

    // Do asyncrhonously
    this._banListService?.postEmbed(this.channel);

    await this.useItem(initiator);
  }
}
