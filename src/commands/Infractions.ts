import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import MemberService from "../services/Member.service";
import Command from "./Command";

@autoInjectable()
export default class Infractions extends Command {
  public constructor(@inject(delay(() => MemberService)) private _memberService?: MemberService) {
    super();
    this.name = "Infractions";
    this.instructions =
      "Get the number of infractions commited by a member. To get your own infraction count, use the command without arguments (`Infractions`)";
    this.usage = "`Infractions [@member]`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    return this.execute(
      cmdMessage.message.member,
      cmdMessage.memberMentions.length ? cmdMessage.memberMentions : [cmdMessage.message.member]
    );
  }

  public async execute(initiator: GuildMember, targets: GuildMember[]): Promise<any> {
    const infractionPromises = targets.map((target) =>
      this._memberService
        ?.getInfractions(target)
        .then((infractCount) => `${target.displayName} has incurred ${infractCount} infractions\n`)
    );

    const feedback = await Promise.all(infractionPromises).then((messages) => messages.join(""));

    await this.reply(feedback);
    await this.useItem(initiator);
  }
}
