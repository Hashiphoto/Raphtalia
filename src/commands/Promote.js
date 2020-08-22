import Discord from "discord.js";

import Command from "./Command.js";

class Promote extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend("Try again and specify who is being promoted");
    }

    this.message.mentionedMembers.forEach((target) => {
      promoteMember(this.inputChannel, this.message.sender, target);
    });
  }
}

export default Promote;
