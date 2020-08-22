import Discord from "discord.js";

import Command from "./Command.js";

class Infractions extends Command {
  execute() {
    if (this.message.mentionedMembers == null || this.message.mentionedMembers.length === 0) {
      return reportInfractions(this.message.sender, this.inputChannel);
    } else {
      return reportInfractions(this.message.mentionedMembers[0], this.inputChannel);
    }
  }
}

export default Infractions;
