import Discord from "discord.js";

import Command from "./Command.js";
import Format from "../Format.js";
import MemberController from "../controllers/MemberController.js";

class Exile extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    const releaseDate = Format.parseTime(this.message.content);
    const memberController = new MemberController(this.db, this.guild);

    let response = "";

    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      let target = this.message.mentionedMembers[i];
      if (!MemberController.hasAuthorityOver(this.sender, target)) {
        memberController
          .addInfractions(this.sender)
          .then(
            (feedback) =>
              (response += `You must hold a rank higher than ${target} to exile them\n${feedback}\n`)
          );
        break;
      }
      memberController.exileMember(target, releaseDate).then((released) => {
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
