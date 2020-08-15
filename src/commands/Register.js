import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import { addRoles } from "../util/roleManagement.js";

class Register extends Command {
  execute() {
    addRoles(this.message.sender, [discordConfig().roles.voter])
      .then(() => {
        this.inputChannel.watchSend(`You are now a registered voter!`);
      })
      .catch(() => {
        this.inputChannel.watchSend(`You are already registered, dingus`);
      });
  }
}

export default Register;
