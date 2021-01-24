import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class SoftKick extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**SoftKick**\nKick the specified member(s) and also send them an invite back to the server";
    this.usage = "Usage: `SoftKick @member [for reason]`";
  }

  async execute(): Promise<any> {
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

    if (!this.sender.hasAuthorityOver(targets)) {
      return this.memberController
        .addInfractions(this.sender)
        .then((feedback) =>
          this.ec.channelHelper.watchSend(
            `You must hold a higher rank than the members you are demoting\n` + feedback
          )
        );
    }

    const softPromises = targets.map((target) => {
      let reason = null;
      const matches = this.message.content.match(/for\s+.*/i);
      if (matches) {
        reason = matches[0];
      }

      return this.memberController.softKick(target, reason, this.message.author);
    });

    return Promise.all(softPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default SoftKick;
