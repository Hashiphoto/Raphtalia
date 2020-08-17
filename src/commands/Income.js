import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import { extractNumber } from "../controllers/format.js";
import { updateServerStatus } from "../controllers/serverStatus.js";
import { getUserIncome } from "../controllers/CurrencyController.js";
import { convertToRole } from "../controllers/RoleController.js";

class Income extends Command {
  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return getUserIncome(this.message.sender).then((income) => {
        return this.inputChannel.watchSend(
          `Your daily income is $${income.toFixed(2)}`
        );
      });
    }

    if (this.message.args.length < 2) {
      return this.inputChannel.watchSend(
        "Usage: `!Income [base $1] [scale ($1|1%)]`"
      );
    }

    // Check for base income set
    for (let i = 0; i < this.message.args.length - 1; i++) {
      if (this.message.args[i] !== "base") {
        continue;
      }
      let amount = extractNumber(this.message.args[i + 1]);
      if (amount.number == null || amount.isPercent) {
        return this.inputChannel.watchSend(
          "Please try again and specify the base pay in dollars. e.g. `!Income base $100`"
        );
      }
      await this.db.guilds.setBaseIncome(this.message.guild.id, amount.number);
    }

    let baseIncome = (await this.db.guilds.get(this.message.guild.id))
      .base_income;

    // Income scale
    for (let i = 0; i < this.message.args.length - 1; i++) {
      if (this.message.args[i] !== "scale") {
        continue;
      }

      let amount = extractNumber(this.message.args[i + 1]);
      if (amount.number == null || amount.isDollar === amount.isPercent) {
        return this.inputChannel.watchSend(
          "Please try again and specify the scale as a percent or dollar amount. e.g. `!Income scale $100` or `!Income scale 125%"
        );
      }
      if (amount.isPercent && amount.number < 1) {
        return this.inputChannel.watchSend(
          "Income scale must be at least 100%"
        );
      }
      let neutralRole = convertToRole(
        this.message.guild,
        discordConfig().roles.neutral
      );
      if (!neutralRole) {
        return this.inputChannel.watchSend("There is no neutral role");
      }
      let roles = this.message.guild.roles
        .filter(
          (role) =>
            role.hoist &&
            role.calculatedPosition >= neutralRole.calculatedPosition
        )
        .sort((a, b) => a.calculatedPosition - b.calculatedPosition)
        .array();

      return this.inputChannel
        .watchSend(await this.setIncomeScale(baseIncome, roles, amount))
        .then(updateServerStatus(this.inputChannel));
    }
  }

  async setIncomeScale(baseIncome, roles, amount) {
    let nextIncome = baseIncome;
    let announcement = "";
    for (let i = 0; i < roles.length; i++) {
      await this.db.roles.setRoleIncome(roles[i].id, nextIncome);
      announcement += `${roles[i].name} will now earn $${nextIncome.toFixed(
        2
      )}\n`;
      if (amount.isDollar) {
        nextIncome += amount.number;
      } else {
        nextIncome = nextIncome * amount.number;
      }
    }
    return announcement;
  }
}

export default Income;
