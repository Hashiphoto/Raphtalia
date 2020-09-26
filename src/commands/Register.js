import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import MemberController from "../controllers/MemberController.js";

class Register extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
  }

  execute() {
    if (this.memberController.hasRole(this.message.sender, discordConfig().roles.voter)) {
      return this.inputChannel.watchSend(`You are already a registered voter`);
    }

    return this.memberController
      .addRoles(this.message.sender, [])
      .then(() => {
        this.inputChannel.watchSend(`You are now a registered voter!`);
      })
      .then(() => this.useItem());
  }
}

export default Register;
