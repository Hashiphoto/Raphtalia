import Discord from "discord.js";

import Command from "./Command.js";
import { demoteMember } from "../util/roleManagement.js";

class Demote extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being demoted"
      );
    }

    this.message.mentionedMembers.forEach((target) => {
      demoteMember(this.inputChannel, this.sender, target);
    });
  }
}

export default Demote;
