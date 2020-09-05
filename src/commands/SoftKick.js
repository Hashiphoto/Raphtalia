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

    let response = "";
    for (const target of this.message.mentionedMembers) {
      if (!this.memberController.hasAuthorityOver(this.sender, target)) {
        await this.memberController
          .addInfractions(this.sender)
          .then(
            (feedback) =>
              (response += `You must hold a rank higher than ${target} to soft kick them\n${feedback}\n`)
          );
        break;
      }

      let reason = null;
      const found = this.message.content.match(/for\s.*/i);
      if (found) {
        reason = found[0];
      }

      await this.memberController
        .softKick(target, reason, this.message.author)
        .then((feedback) => (response += feedback));
    }

    return this.inputChannel.watchSend(response);
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `SoftKick @member [reason]`");
  }
}

export default SoftKick;
