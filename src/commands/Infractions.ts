import Command from "./Command";
import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Infractions extends Command {
  public constructor() {
    super();
    this.instructions =
      "**Infractions**\nGet the number of infractions commited by a member. To get your own infraction count, use the command without arguments (`Infractions`)";
    this.usage = "Usage: `Infractions [@member]`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    if (
      this.ec.messageHelper.mentionedMembers == null ||
      this.ec.messageHelper.mentionedMembers.length === 0
    ) {
      return this.reportInfractions(initiator);
    } else {
      return this.reportInfractions(this.ec.messageHelper.mentionedMembers[0]);
    }
  }

  private reportInfractions(member: GuildMember) {
    return this.ec.memberController
      .getInfractions(member)
      .then((infractCount) =>
        this.reply(`${member.toString()} has incurred ${infractCount} infractions\n`)
      )
      .then(() => this.useItem(initiator));
  }
}
