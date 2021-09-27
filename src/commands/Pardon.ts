import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import MemberService from "../services/Member.service";
import Command from "./Command";

@autoInjectable()
export default class Pardon extends Command {
  public constructor(@inject(delay(() => MemberService)) private _memberService?: MemberService) {
    super();
    this.name = "Pardon";
    this.instructions =
      "Removes all infractions from the specified member(s). " +
      "If the members are exiled, they are also freed from exile";
    this.usage = "`Pardon @member`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.memberMentions);
  }

  public async execute(initiator: GuildMember, targets: GuildMember[]): Promise<any> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    const pardonPromises = targets.map((target) => this._memberService?.pardonMember(target));

    await Promise.all(pardonPromises)
      .then((messages) => messages.join(""))
      .then((response) => this.reply(response));
    await this.useItem(initiator, targets.length);
  }
}
