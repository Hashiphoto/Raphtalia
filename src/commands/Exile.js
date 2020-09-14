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
  }

  execute() {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    // Current time + exile duration
    const duration = Format.parseTime(this.message.content);
    const releaseDate = duration ? dayjs().add(duration) : null;

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
      this.memberController.exileMember(target, releaseDate).then((released) => {
        if (released) {
          this.inputChannel.watchSend(`${target} has been released from exile!`);
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

    return this.inputChannel.watchSend(response).then(() => Promise.all(exilePromises));
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Exile @target [1d 1h 1m 1s]`");
  }
}

export default Exile;
