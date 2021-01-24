import Command from "./Command.js";
import Discord from "discord.js";
import MemberController from "../controllers/MemberController.js";

class Infractions extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**Infractions**\nGet the number of infractions commited by a member. To get your own infraction count, use the command without arguments (`Infractions`)";
    this.usage = "Usage: `Infractions [@member]`";
  }

  async execute(): Promise<any> {
    if (this.message.mentionedMembers == null || this.message.mentionedMembers.length === 0) {
      return this.reportInfractions(this.sender);
    } else {
      return this.reportInfractions(this.message.mentionedMembers[0]);
    }
  }

  reportInfractions(member) {
    return this.memberController
      .getInfractions(member)
      .then((infractCount) =>
        this.ec.channelHelper.watchSend(`${member} has incurred ${infractCount} infractions\n`)
      )
      .then(() => this.useItem());
  }
}

export default Infractions;
