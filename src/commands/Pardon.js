import Discord from "discord.js";
import dayjs from "dayjs";
import MemberController from "../controllers/MemberController.js";

import Command from "./Command.js";

class Pardon extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**Pardon**\nRemoves all infractions from the specified member(s). " +
      "If the members are exiled, they are also freed from exile";
    this.usage = "Usage: `Pardon @member`";
  }

  execute() {
    const targets = this.message.mentionedMembers;
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    const pardonPromises = targets.map((target) => {
      return this.memberController.pardonMember(target, this.inputChannel);
    });

    return Promise.all(pardonPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default Pardon;
