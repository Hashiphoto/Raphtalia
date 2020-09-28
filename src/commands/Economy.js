import Discord from "discord.js";

import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";
import RNumber from "../structures/RNumber.js";

class Economy extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {GuildController} guildController
   */
  constructor(message, guildController) {
    super(message);
    this.guildController = guildController;
    this.instructions =
      "**Economy**\nSet the parameters for message payment and tax rate\n" +
      "`MinLength` specifies the minimum character count for a message to be awarded money\n" +
      "`CharValue` specifies how much money is earned for each character in the message\n" +
      "`BasePayout` adds a flat value to each paid message\n" +
      "`MaxPayout` limits the amount earned for an individual message\n" +
      "`TaxRate` specifies how much money will be taken from each member on a weekly basis";
    this.usage =
      "Usage: `Economy [MinLength 1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`";
  }

  execute() {
    if (this.message.args.length < 2) {
      return this.sendHelpMessage();
    }

    const promises = [];

    // Every other argument will be a flag and number, alternating
    for (let i = 0; i < this.message.args.length; i += 2) {
      const flag = this.message.args[i];
      const rNumber =
        i + 1 < this.message.args.length ? RNumber.parse(this.message.args[i + 1]) : null;

      // If no value is supplied for a flag, abort the operation
      if (!rNumber) {
        return this.sendHelpMessage(`Please specify what amount you want "${flag}" to be set to.`);
      }

      const subCommand = this.parseArg(flag, rNumber);

      // If any args fail to parse, abort the operation
      if (!subCommand) {
        return this.sendHelpMessage(`Unknown parameter "${flag}"`);
      }

      promises.push(subCommand);
    }

    return Promise.all(promises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem());
  }

  parseArg(arg, rNumber) {
    switch (arg.toLowerCase()) {
      case "minlength":
        rNumber.type = RNumber.types.INT;
        return this.guildController.setMinLength(rNumber.amount).then(() => {
          return `The minimum length for a message to be a paid is now ${rNumber.toString()} characters\n`;
        });
      case "charvalue":
        rNumber.type = RNumber.types.DOLLAR;
        return this.guildController.setCharacterValue(rNumber.amount).then(() => {
          return `Messages over the minimum length earn ${rNumber.toString()} per character\n`;
        });
      case "maxpayout":
        rNumber.type = RNumber.types.DOLLAR;
        return this.guildController.setMaxPayout(rNumber.amount).then(() => {
          return `The max value earned from a paid message is now ${rNumber.toString()}\n`;
        });
      case "basepayout":
        rNumber.type = RNumber.types.DOLLAR;
        return this.guildController.setBasePayout(rNumber.amount).then(() => {
          return `Messages over the minimum length earn a base pay of ${rNumber.toString()}\n`;
        });
      case "taxrate":
        rNumber.type = RNumber.types.PERCENT;
        return this.guildController.setTaxRate(rNumber.amount).then(() => {
          return `Members are taxed ${rNumber.toString()} of their role income on a weekly basis\n`;
        });
      default:
        return null;
    }
  }
}

export default Economy;
