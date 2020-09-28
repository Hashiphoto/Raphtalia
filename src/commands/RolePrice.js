import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import RNumber from "../structures/RNumber.js";
import GuildController from "../controllers/GuildController.js";
import RoleUtil from "../RoleUtil.js";
import RoleStatusController from "../controllers/RoleStatusController.js";

class RolePrice extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {GuildController} guildController
   * @param {RoleStatusController} roleStatusCtlr
   */
  constructor(message, guildController, roleStatusCtlr) {
    super(message);
    this.guildController = guildController;
    this.roleStatusCtlr = roleStatusCtlr;
    this.instructions = "**RolePrice**\nSet the price of a role proportional to its daily income";
    this.usage = "Usage: `RolePrice 1x`";
  }

  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    let multiplier = RNumber.parse(this.message.args[0]);
    if (!multiplier) {
      return this.sendHelpMessage("Please try again and specify a multiplier");
    }

    let response = `Every role's purchase price is now ${multiplier.toString()} its daily income!\n`;
    let neutralRole = RoleUtil.convertToRole(this.message.guild, discordConfig().roles.neutral);
    if (!neutralRole) {
      return this.inputChannel.watchSend("There is no neutral role");
    }

    return this.guildController
      .setRolePriceMultiplier(multiplier.amount, neutralRole)
      .then((feedback) => this.inputChannel.watchSend(`${response}\n${feedback}`))
      .then(this.roleStatusCtlr.update())
      .then(() => this.useItem());
  }
}

export default RolePrice;
