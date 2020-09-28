import Discord from "discord.js";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";
import GuildController from "../controllers/GuildController.js";
import RoleUtil from "../RoleUtil.js";
import RoleStatusController from "../controllers/RoleStatusController.js";

class Income extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {GuildController} guildController
   * @param {RoleStatusController} roleStatusCtlr
   */
  constructor(message, currencyController, guildController, roleStatusCtlr) {
    super(message);
    this.currencyController = currencyController;
    this.guildController = guildController;
    this.roleStatusCtlr = roleStatusCtlr;
    this.instructions =
      "**Income**\nTo get your current income, use this command with no arguments (`Income`) " +
      "To set the income scale for all roles, specify both the `base` and `scale` parameters\n" +
      "`base` sets the income for the normal role and is what the income scale is based on.\n" +
      "`scale` sets either a linear or exponential scale. " +
      "If a dollar amount x is used, each role will be given x more dollars than the previous role. " +
      "If a percentage y is used, each role will be y% of the previous role, where y is greater than 100%.";
    this.usage = "Usage: `Income [base $1] [scale ($1|1%)]`";
  }

  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.currencyController.getUserIncome(this.message.sender).then((income) => {
        return this.inputChannel.watchSend(`Your daily income is ${RNumber.formatDollar(income)}`);
      });
    }

    if (this.message.args.length < 2) {
      return this.sendHelpMessage();
    }

    // Get base income
    let baseIncome = this.getBaseIncome();
    if (baseIncome == null) {
      return this.sendHelpMessage(
        "Please try again and specify the base pay in dollars. e.g. `Income base $100 scale $1`"
      );
    }

    // Get scale
    const scaleNumber = this.getScale();
    if (scaleNumber == null) {
      return this.sendHelpMessage(
        "Please try again and specify the scale as a percent (greater than 100%) or dollar amount. e.g. `Income base $0 scale $100` or `Income base $0 scale 125%`"
      );
    }

    await this.guildController.setBaseIncome(baseIncome);

    const neutralRole = RoleUtil.convertToRole(this.message.guild, discordConfig().roles.neutral);
    if (!neutralRole) {
      return this.inputChannel.watchSend("There is no neutral role");
    }
    const roles = RoleUtil.getHoistedRoles(this.guild)
      .filter((role) => role.calculatedPosition >= neutralRole.calculatedPosition)
      .array();

    // TODO: SSC should be passed in
    return this.inputChannel
      .watchSend(await this.guildController.setIncomeScale(baseIncome, roles, scaleNumber))
      .then(() => this.roleStatusCtlr.update())
      .then(() => this.useItem());
  }

  getBaseIncome() {
    let baseIncome = 0;
    const baseIndex = this.message.args.indexOf("base");
    if (baseIndex >= 0) {
      let baseIncomeNumber = RNumber.parse(this.message.args[baseIndex + 1]);
      if (!baseIncomeNumber) {
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
}

export default Income;
