import Discord from "discord.js";
import dayjs from "dayjs";
import MemberController from "../controllers/MemberController.js";

import Command from "./Command.js";

class Pardon extends Command {
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
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being pardoned"
      );
    }

    this.message.mentionedMembers.forEach((target) => {
      this.memberController.pardonMember(target, this.inputChannel).then((feedback) => {
        this.inputChannel.watchSend(feedback);
      });
    });
  }
}

export default Pardon;
