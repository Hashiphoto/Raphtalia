import Command from "./Command.js";
import Discord from "discord.js";

class Headpat extends Command {
  constructor(message) {
    super(message);
    this.instructions = "**Headpat**\nI will give a headpat to the member(s) is specified";
    this.usage = "Usage: `Headpat @member`";
  }

  execute(): Promise<any> {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let response = "";
    for (const member of targets) {
      response += `${member} headpat\n`;
    }

    return this.ec.channelHelper.watchSend(response).then(() => this.useItem(targets.length));
  }
}

export default Headpat;
