import Discord from "discord.js";

import Command from "./Command.js";

class Comfort extends Command {
  execute() {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let response = "";
    for (const member of targets) {
      response += `${member} headpat\n`;
    }

    return this.inputChannel.watchSend(response).then(() => this.useItem(targets.length));
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Comfort @member`");
  }
}

export default Comfort;
