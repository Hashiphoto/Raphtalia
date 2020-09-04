import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import MemberController from "../controllers/MemberController.js";

class Register extends Command {
  execute() {
    const memberController = new MemberController(this.db, this.guild);

    if (memberController.hasRole(this.message.sender, discordConfig().roles.voter)) {
      return this.inputChannel.watchSend(`You are already a registered voter`);
    }

    return memberController.addRoles(this.message.sender, []).then(() => {
      this.inputChannel.watchSend(`You are now a registered voter!`);
    });
  }
}

export default Register;
