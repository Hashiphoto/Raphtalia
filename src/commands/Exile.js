import Discord from "discord.js";

import Command from "./Command.js";
import { parseTime } from "../util/format.js";
import { exileMember } from "../util/roleManagement.js";

class Exile extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      if (this.inputChannel)
        this.inputChannel.watchSend(
          "Please repeat the command and specify who is being exiled"
        );
      return;
    }

    const releaseDate = parseTime(this.message.content);

    this.message.mentionedMembers.forEach((target) => {
      exileMember(target, this.inputChannel, releaseDate);
    });
  }
}

export default Exile;
