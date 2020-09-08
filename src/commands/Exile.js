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
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    // Current time + exile duration
    const releaseDate = dayjs().add(Format.parseTime(this.message.content));

    let response = "";

    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      let target = this.message.mentionedMembers[i];
      if (!this.memberController.hasAuthorityOver(this.sender, target)) {
        this.memberController
          .addInfractions(this.sender)
          .then(
            (feedback) =>
              (response += `You must hold a rank higher than ${target} to exile them\n${feedback}\n`)
          );
        break;
      }
      this.memberController.exileMember(target, releaseDate).then((released) => {
        if (released) {
          this.inputChannel.watchSend(`${target} has been released from exile!`);
        }
      });
      response += `${target} has been exiled ${
        releaseDate ? `until ${Format.formatDate(releaseDate)}` : `indefinitely`
      }\n`;
    }

    return this.inputChannel.watchSend(response);
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Exile @target [1d 1h 1m 1s]`");
  }
}

export default Exile;
