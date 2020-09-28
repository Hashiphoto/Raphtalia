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
    this.instructions = "**Demote**\nReduce the rank of the specified member(s) by one";
    this.usage = "Usage: `Demote @member`";
  }

  execute() {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
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

    return Promise.all(demotePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default Demote;
