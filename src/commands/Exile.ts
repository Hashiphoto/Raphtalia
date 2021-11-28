import dayjs from "dayjs";
import { Duration } from "dayjs/plugin/duration";
import { TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import { ITargettedProps } from "../interfaces/CommandInterfaces";
import CommandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import MemberService from "../services/Member.service";
import { formatDate, parseDuration } from "../utilities/Util";
import Command from "./Command";

interface IExileProps extends ITargettedProps {
  duration: Duration;
}

@autoInjectable()
export default class Exile extends Command<IExileProps> {
  public constructor(@inject(delay(() => MemberService)) private _memberService?: MemberService) {
    super();
    this.name = "Exile";
    this.instructions =
      "Put a specified member in exile for a period of time. " +
      "Exiled members cannot use any commands. If no time is specified, the maximum value of 6 hours will be used. ";
    this.usage = "`Exile @member [1h 1m 1s]`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    // Input or default 6 hours
    const duration = parseDuration(cmdMessage.parsedContent) ?? dayjs.duration({ hours: 6 });

    await this.runWithItem({
      initiator: cmdMessage.message.member,
      targets: cmdMessage.memberMentions,
      duration,
    });
  }

  public async execute({ targets, duration }: IExileProps): Promise<number | undefined> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
      return;
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
    return targets.length;
  }
}
