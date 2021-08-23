import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import MemberService from "../services/Member.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import { sumString } from "../utilities/Util";

@autoInjectable()
export default class Infractions extends Command {
  public constructor(private _memberService?: MemberService) {
    super();
    this.name = "Infractions";
    this.instructions =
      "**Infractions**\nGet the number of infractions commited by a member. To get your own infraction count, use the command without arguments (`Infractions`)";
    this.usage = "Usage: `Infractions [@member]`";
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

    const feedback = await Promise.all(infractionPromises).then((messages) =>
      messages.reduce(sumString)
    );

    await this.reply(feedback);
    await this.useItem(initiator);
  }
}
