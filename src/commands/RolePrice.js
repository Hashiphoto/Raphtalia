import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import RNumber from "../structures/RNumber.js";
import GuildController from "../controllers/GuildController.js";
import ServerStatusUpdater from "../ServerStatusUpdater.js";
import RoleUtil from "../RoleUtil.js";

class RolePrice extends Command {
  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    let multiplier = RNumber.parse(this.message.args[0]);
    if (!multiplier) {
      return this.sendHelpMessage();
    }

    let response = `Every role's purchase price is now ${multiplier.toString()} its daily income!\n`;
    let neutralRole = RoleUtil.convertToRole(this.message.guild, discordConfig().roles.neutral);
    if (!neutralRole) {
      return this.inputChannel.watchSend("There is no neutral role");
    }

    const guildController = new GuildController(this.db, this.guild);
    const serverStatusUpdater = new ServerStatusUpdater(this.db, this.guild);

    return guildController
      .setRolePriceMultiplier(multiplier.amount, neutralRole)
      .then((feedback) => this.inputChannel.watchSend(`${response}\n${feedback}`))
      .then(serverStatusUpdater.updateServerStatus());
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `RolePrice 1x`");
  }
}

export default RolePrice;
