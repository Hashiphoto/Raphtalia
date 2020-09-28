import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import Format from "../Format.js";
import MemberController from "../controllers/MemberController.js";

class Exile extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**Exile**\nPut a specified member in exile for a period of time. " +
      "Exiled members cannot use any commands";
    this.usage = "Usage: `Exile @member [1d 1h 1m 1s]`";
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

    // Current time + exile duration
    const duration = Format.parseTime(this.message.content);
    const releaseDate = duration != null ? dayjs().add(duration) : null;

    if (!this.sender.hasAuthorityOver(targets)) {
      return this.memberController
        .addInfractions(this.sender)
        .then((feedback) =>
          this.inputChannel.watchSend(
            `You must hold a higher rank than the members you are exiling\n` + feedback
          )
        );
    }

    const exilePromises = targets.map((target) =>
      this.memberController.exileMember(target, duration).then((released) => {
        if (released) {
          return this.inputChannel.watchSend(`${target} has been released from exile!`);
        }
      })
    );

    const response = targets.reduce(
      (sum, target) =>
        sum +
        `${target} has been exiled ${
          releaseDate ? `until ${Format.formatDate(releaseDate)}` : `indefinitely`
        }\n`,
      ""
    );

    return this.inputChannel
      .watchSend(response)
      .then(() => Promise.all(exilePromises))
      .then(() => this.useItem(targets.length));
  }
}

export default Exile;
