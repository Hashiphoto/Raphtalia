import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Promote extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  execute() {
    // Targetting removed for now since I think it should only self-promote
    //
    // const targets = this.message.mentionedMembers;
    // if (targets.length === 0) {
    //   return this.inputChannel.watchSend("Try again and specify who is being promoted");
    // }

    // if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
    //   return this.inputChannel.watchSend(
    //     `Your ${this.item.name} does not have enough charges. ` +
    //       `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
    //   );
    // }
    const targets = [this.message.sender];

    const promotePromises = targets.map((target) => {
      return this.memberController.promoteMember(this.message.sender, target);
    });

    return Promise.all(promotePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default Promote;
