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
  }

  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being pardoned"
      );
    }

    const pardonPromises = this.message.mentionedMembers.map((target) => {
      return this.memberController.pardonMember(target, this.inputChannel);
    });

    return Promise.all(pardonPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem());
  }
}

export default Pardon;
