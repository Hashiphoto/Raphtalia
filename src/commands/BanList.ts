import { GuildMember, TextChannel } from "discord.js";

import BanListService from "../services/message/BanWordList.service";
import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class BanList extends Command {
  public constructor(private _banListService?: BanListService) {
    super();
    this.name = "BanList";
    this.instructions = "Post the Banned Words List in this channel";
    this.usage = "`BanList`";
    this.aliases = [this.name.toLowerCase(), "bannedwords"];
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<void> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._banListService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._banListService?.postEmbed(this.channel);

    await this.useItem(initiator);
  }
}
