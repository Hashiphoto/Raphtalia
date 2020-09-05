import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Promote extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
  }

  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend("Try again and specify who is being promoted");
    }

    this.message.mentionedMembers.forEach((target) => {
      this.memberController
        .promoteMember(this.message.sender, target)
        .then((feedback) => this.inputChannel.watchSend(feedback));
    });
  }
}

export default Promote;
