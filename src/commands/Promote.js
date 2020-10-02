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
    return this.memberController
      .promoteMember(this.message.member)
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem());
  }
}

export default Promote;
