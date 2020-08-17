import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import { extractNumber } from "../controllers/format.js";
import { updateServerStatus } from "../controllers/serverStatus.js";
import { convertToRole } from "../controllers/RoleController.js";

class RolePrice extends Command {
  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.inputChannel.watchSend(`Usage: !RolePrice 1`);
    }
    let multiplier = extractNumber(this.message.args[0]).number;
    if (multiplier == null) {
      return this.inputChannel.watchSend(`Usage: !RolePrice 1`);
    }

    let announcement = `Every role's purchase price is now ${multiplier.toFixed(
      2
    )}x its daily income!\n`;
    let neutralRole = convertToRole(
      this.message.guild,
      discordConfig().roles.neutral
    );
    if (!neutralRole) {
      return this.inputChannel.watchSend("There is no neutral role");
    }
    let discordRoles = this.message.guild.roles
      .filter(
        (role) =>
          role.hoist &&
          role.calculatedPosition >= neutralRole.calculatedPosition
      )
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .array();

    for (let i = 0; i < discordRoles.length; i++) {
      let dbRole = await this.db.roles.getSingle(discordRoles[i].id);
      let newPrice = dbRole.income * multiplier;
      this.db.roles.setRolePrice(discordRoles[i].id, newPrice);
      announcement += `${discordRoles[i].name} new price: $${newPrice.toFixed(
        2
      )}\n`;
    }
    this.inputChannel
      .watchSend(announcement)
      .then(updateServerStatus(this.inputChannel));
  }
}

export default RolePrice;
