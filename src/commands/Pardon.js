import Discord from "discord.js";
import dayjs from "dayjs";
import MemberController from "../controllers/MemberController.js";

import Command from "./Command.js";

class Pardon extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being pardoned"
      );
    }

    const memberController = new MemberController(this.db, this.guild);

    this.message.mentionedMembers.forEach((target) => {
      memberController.pardonMember(target, this.inputChannel).then((feedback) => {
        this.inputChannel.watchSend(feedback);
      });
    });
  }
}

export default Pardon;
