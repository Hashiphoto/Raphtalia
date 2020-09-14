import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Demote extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
  }

  execute() {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
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

    const demotePromises = targets.map((target) => this.memberController.demoteMember(target));

    return (
      Promise.all(demotePromises)
        // .then((demotionMessages) => demotionMessages.reduce((sum, value) => sum + value))
        .then((messages) => messages.reduce(this.sum))
        .then((response) => this.inputChannel.watchSend(response))
    );
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Demote @member`");
  }
}

export default Demote;
