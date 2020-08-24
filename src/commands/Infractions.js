import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Infractions extends Command {
  async execute() {
    const memberController = new MemberController(this.db, this.guild);

    if (this.message.mentionedMembers == null || this.message.mentionedMembers.length === 0) {
      return memberController
        .getInfractions(this.sender)
        .then((infractions) => this.reportInfractions(this.sender, infractions));
    } else {
      return memberController
        .getInfractions(this.message.mentionedMembers[0])
        .then((infractions) => this.reportInfractions(this.sender, infractions));
    }
  }

  reportInfractions(member, infractCount) {
    return this.inputChannel.watchSend(`${member} has incurred ${infractCount} infractions\n`);
  }
}

export default Infractions;
