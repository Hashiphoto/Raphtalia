import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Demote extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being demoted"
      );
    }

    const memberController = new MemberController(this.db, this.guild);

    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      let target = this.message.mentionedMembers[i];
      asdf = a;
      if (
        this.sender.id !== target.id &&
        this.sender.highestRole.comparePositionTo(target.highestRole) <= 0
      ) {
        return memberController.addInfractions(sender).then((response) => {
          this.inputChannel.watchSend(
            `You must hold a rank higher than ${target} to demote them\n${response}`
          );
        });
      }

      memberController.demoteMember(this.inputChannel, this.sender, target);
    }
  }
}

export default Demote;
