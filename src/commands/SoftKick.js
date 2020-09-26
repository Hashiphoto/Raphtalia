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
  }

  async execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.sender.hasAuthorityOver(targets)) {
      return this.memberController
        .addInfractions(this.sender)
        .then((feedback) =>
          this.inputChannel.watchSend(
            `You must hold a higher rank than the members you are demoting\n` + feedback
          )
        );
    }

    const softPromises = this.message.mentionedMembers.map((target) => {
      let reason = null;
      const matches = this.message.content.match(/for\s+.*/i);
      if (matches) {
        reason = matches[0];
      }

      return this.memberController
        .softKick(target, reason, this.message.author)
        .then((feedback) => (response += feedback));
    });

    return Promise.all(softPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem());
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `SoftKick @member [reason]`");
  }
}

export default SoftKick;
