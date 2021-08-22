import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import MemberService from "../services/Member.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Promote extends Command {
  public constructor(private _memberService?: MemberService) {
    super();
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "This command needs a channel");
    }
    try {
      await this._memberService?.promoteMember(initiator, this.channel);
    } catch (error) {
      if (error.name === "RaphError") {
        return this.reply(error.message);
      }
      throw error;
    }

    return this.useItem(initiator);
  }
}
