import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Infractions extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
  }

  async execute() {
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
        this.inputChannel.watchSend(`${member} has incurred ${infractCount} infractions\n`)
      )
      .then(() => this.useItem());
  }
}

export default Infractions;
