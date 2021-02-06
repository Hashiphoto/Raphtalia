import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import { GuildMember } from "discord.js";

export default class Infractions extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Infractions**\nGet the number of infractions commited by a member. To get your own infraction count, use the command without arguments (`Infractions`)";
    this.usage = "Usage: `Infractions [@member]`";
  }

  public async execute(): Promise<any> {
    if (
      this.ec.messageHelper.mentionedMembers == null ||
      this.ec.messageHelper.mentionedMembers.length === 0
    ) {
      return this.reportInfractions(this.ec.initiator);
    } else {
      return this.reportInfractions(this.ec.messageHelper.mentionedMembers[0]);
    }
  }

  private reportInfractions(member: GuildMember) {
    return this.ec.memberController
      .getInfractions(member)
      .then((infractCount) =>
        this.ec.channelHelper.watchSend(`${member} has incurred ${infractCount} infractions\n`)
      )
      .then(() => this.useItem());
  }
}
