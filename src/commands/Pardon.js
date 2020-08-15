import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import { pardonMember } from "../util/roleManagement.js";

class Pardon extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      if (this.inputChannel)
        this.inputChannel.watchSend(
          "Please repeat the command and specify who is being pardoned"
        );
      return;
    }

    this.message.mentionedMembers.forEach((target) => {
      pardonMember(target, this.inputChannel);
    });
  }
}

export default Pardon;
