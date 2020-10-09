import Discord from "discord.js";

import Command from "./Command.js";

class Headpat extends Command {
  constructor(message) {
    super(message);
    this.instructions = "**Comfort**\nI will give a headpat to the member(s) is specified";
    this.usage = "Usage: `Comfort @member`";
  }

  execute() {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
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
}

export default Headpat;
