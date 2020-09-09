import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";
import AuthorityError from "../structures/AuthorityError.js";

class Demote extends Command {
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

    const promises = [];
    for (const target of this.message.mentionedMembers) {
      promises.push(
        this.hasAuthorityOver(target)
          .then(() => this.memberController.demoteMember(target))
          .catch((error) => {
            if (error instanceof AuthorityError) {
              return `You must hold a rank higher than ${target} to demote them\n`;
            }
            throw error;
          })
      );
    }

    return Promise.all(promises)
      .then((responses) => responses.reduce((sum, value) => sum + value))
      .then((response) => this.inputChannel.watchSend(response));
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Demote @member`");
  }
}

export default Demote;
