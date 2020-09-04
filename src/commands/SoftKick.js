import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class SoftKick extends Command {
  async execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    const memberController = new MemberController(this.db, this.guild);

    let response = "";
    for (const target of this.message.mentionedMembers) {
      if (!MemberController.hasAuthorityOver(this.sender, target)) {
        await memberController
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

      await memberController
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
