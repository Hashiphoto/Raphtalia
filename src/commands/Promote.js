import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";
import MemberLimitError from "../structures/errors/MemberLimitError.js";

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
    return this.memberController
      .promoteMember(this.message.member)
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem())
      .catch((error) => {
        if (error instanceof MemberLimitError) {
          return this.inputChannel.watchSend(error.message);
        }
        throw error;
      });
  }
}

export default Promote;
