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

    let amount = 1;

    for (const arg of this.message.args) {
      let relMatches = arg.match(/^\+?\d+$/g);
      if (relMatches) {
        amount = parseInt(relMatches[0]);
        break;
      }
    }

    let response = "";

    for (const target of this.message.mentionedMembers) {
      if (!this.memberController.hasAuthorityOver(this.sender, target)) {
        await this.memberController
          .addInfractions(this.sender)
          .then(
            (feedback) =>
              (response += `You must hold a rank higher than ${target} to report them\n${feedback}\n`)
          );
        break;
      }

      await this.memberController
        .addInfractions(target, amount)
        .then((feedback) => (response += feedback));
    }

    return this.inputChannel.watchSend(response);
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Report @member [+1]");
  }
}

export default Report;
