import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Report extends Command {
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
            `You must hold a higher rank than the members you are reporting\n` + feedback
          )
        );
    }

    const reportPromises = this.message.mentionedMembers.map((target) => {
      return this.memberController.addInfractions(target);
    });

    return Promise.all(reportPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem());
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Report @member");
  }
}

export default Report;
