import { GuildMember, TextChannel } from "discord.js";
import { formatDate, parseDuration } from "../utilities/Util";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import { Duration } from "dayjs/plugin/duration";
import MemberService from "../services/Member.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import RoleService from "../services/Role.service";
import { autoInjectable } from "tsyringe";
import dayjs from "dayjs";

@autoInjectable()
export default class Exile extends Command {
  public constructor(private _roleService?: RoleService, private _memberService?: MemberService) {
    super();
    this.instructions =
      "**Exile**\nPut a specified member in exile for a period of time. " +
      "Exiled members cannot use any commands. If no time is specified, the maximum value of 6 hours will be used. ";
    this.usage = "Usage: `Exile @member [1h 1m 1s]`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    // Input or default 6 hours
    const duration = parseDuration(cmdMessage.parsedContent) ?? dayjs.duration({ hours: 6 });

    return this.execute(cmdMessage.message.member, cmdMessage.memberMentions, duration);
  }

  public async execute(
    initiator: GuildMember,
    targets: GuildMember[],
    duration: Duration
  ): Promise<any> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }
    // Current time + exile duration
    const releaseDate = dayjs().add(duration);

    const response = targets.reduce(
      (sum, target) =>
        sum + `${target.toString()} has been exiled until ${formatDate(releaseDate)}`,
      ""
    );

    const exilePromises = targets.map((target) =>
      this._memberService?.exileMember(target, duration).then(() => {
        return this.reply(`${target.toString()} has been released from exile!`);
      })
    );

    // Important to run asynchronously
    Promise.all(exilePromises);

    await this.reply(response);
    await this.useItem(initiator, targets.length);
  }
}
