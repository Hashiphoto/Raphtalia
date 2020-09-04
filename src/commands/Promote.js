import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Promote extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend("Try again and specify who is being promoted");
    }

    const memberController = new MemberController(this.db, this.guild);

    this.message.mentionedMembers.forEach((target) => {
      memberController
        .promoteMember(this.message.sender, target)
        .then((feedback) => this.inputChannel.watchSend(feedback));
    });
  }
}

export default Promote;
