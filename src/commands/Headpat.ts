import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class Headpat extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Headpat**\nI will give a headpat to the member(s) is specified";
    this.usage = "Usage: `Headpat @member`";
  }

  public async execute(): Promise<any> {
    const targets = this.ec.messageHelper.mentionedMembers;

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
