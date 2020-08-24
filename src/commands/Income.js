import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import ServerStatusUpdater from "../controllers/ServerStatusUpdater.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";
import GuildController from "../controllers/GuildController.js";
import RoleUtil from "../controllers/RoleUtil.js";

class Income extends Command {
  async execute() {
    const currencyController = new CurrencyController(this.db, this.guild);
    const guildController = new GuildController(this.db, this.guild);

    if (!this.message.args || this.message.args.length === 0) {
      return currencyController.getUserIncome(this.message.sender).then((income) => {
        return this.inputChannel.watchSend(`Your daily income is ${RNumber.formatDollar(income)}`);
      });
    }

    if (this.message.args.length < 2) {
      return this.sendHelpMessage();
    }

    // Get base income
    let baseIncome = this.getBaseIncome();
    if (baseIncome == null) {
      return this.inputChannel.watchSend(
        "Please try again and specify the base pay in dollars. e.g. `Income base $100`"
      );
    }

    // Get scale
    const scaleNumber = this.getScale();
    if (scaleNumber == null) {
      return this.inputChannel.watchSend(
        "Please try again and specify the scale as a percent (greater than 100%) or dollar amount. e.g. `Income scale $100` or `Income scale 125%`"
      );
    }

    await guildController.setBaseIncome(baseIncome);

    const neutralRole = RoleUtil.convertToRole(this.message.guild, discordConfig().roles.neutral);
    if (!neutralRole) {
      return this.inputChannel.watchSend("There is no neutral role");
    }
    const roles = RoleUtil.getHoistedRoles(this.guild)
      .filter((role) => role.calculatedPosition >= neutralRole.calculatedPosition)
      .array();

    return this.inputChannel
      .watchSend(await guildController.setIncomeScale(baseIncome, roles, scaleNumber))
      .then(new ServerStatusUpdater(this.db).updateServerStatus(this.inputChannel));
  }

  getBaseIncome() {
    let baseIncome = 0;
    const baseIndex = this.message.args.indexOf("base");
    if (baseIndex >= 0) {
      let baseIncomeNumber = RNumber.parse(this.message.args[baseIndex + 1]);
      if (baseIncomeNumber.amount == null) {
        return null;
      }
      baseIncome = baseIncomeNumber.amount;
    }
    return baseIncome;
  }

  getScale() {
    const scaleIndex = this.message.args.indexOf("scale");
    if (scaleIndex < 0) {
      return null;
    }
    const scaleNumber = RNumber.parse(this.message.args[scaleIndex + 1]);
    if (
      scaleNumber == null ||
      (scaleNumber.type != RNumber.types.DOLLAR && scaleNumber.type != RNumber.types.PERCENT) ||
      (scaleNumber.type === RNumber.types.PERCENT && scaleNumber.amount < 1)
    ) {
      return null;
    }
    return scaleNumber;
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Income [base $1] [scale ($1|1%)]`");
  }
}

export default Income;
