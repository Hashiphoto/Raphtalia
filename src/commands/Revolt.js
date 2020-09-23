import Discord from "discord.js";

import Command from "./Command.js";

class Comfort extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    let response = "";
    for (const member of this.message.mentionedMembers) {
      response += `${member} headpat\n`;
    }

    return this.inputChannel.watchSend(response);
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Comfort @member`");
  }
}

export default Comfort;
