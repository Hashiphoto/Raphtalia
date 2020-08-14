import Discord from "discord.js";

import Command from "./Command.js";

class Comfort extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      this.inputChannel.watchSend(
        "Please repeat the command and specify who I'm headpatting"
      );
      return;
    }

    this.message.mentionedMembers.forEach((member) => {
      this.inputChannel.watchSend(member.toString() + " headpat");
    });
  }
}

export default Comfort;
