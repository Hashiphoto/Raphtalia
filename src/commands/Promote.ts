import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import MemberService from "../services/Member.service";
import Command from "./Command";

@autoInjectable()
export default class Promote extends Command {
  public constructor(@inject(delay(() => MemberService)) private _memberService?: MemberService) {
    super();
    this.name = "Promote";
    this.instructions = "Increase your rank by one";
    this.usage = "`Promote`";
    this.aliases = [this.name.toLowerCase()];
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
      const feedback = await this._memberService?.promoteMember(initiator, this.channel);
      if (feedback && feedback.length > 0) {
        this.reply(feedback);
      }
    } catch (error) {
      if (error.name === "RaphError") {
        return this.reply(error.message);
      }
      throw error;
    }

    return this.useItem(initiator);
  }
}
