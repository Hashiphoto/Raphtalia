import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Demote extends Command {
  async execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being demoted"
      );
    }

    const memberController = new MemberController(this.db, this.guild);

    let response = "";

    for (const target of this.message.mentionedMembers) {
      if (!MemberController.hasAuthorityOver(this.sender, target)) {
        await memberController
          .addInfractions(this.sender)
          .then(
            (feedback) =>
              (response += `You must hold a rank higher than ${target} to demote them\n${feedback}\n`)
          );
        break;
      }

      await memberController
        .demoteMember(this.inputChannel, this.sender, target)
        .then((feedback) => (response += feedback));
    }

    return this.inputChannel.watchSend(response);
  }
}

export default Demote;
