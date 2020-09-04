import Discord from "discord.js";

import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";
import RNumber from "../structures/RNumber.js";

class Economy extends Command {
  helpText =
    "Usage: `Economy [MinLength 1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`";

  execute() {
    if (!this.message.args || this.message.args.length <= 1) {
      return this.sendHelpMessage();
    }

    const guildController = new GuildController(this.db, this.guild);

    let response = "";

    // Every other argument will be a flag and number, alternating
    for (let i = 0; i < this.message.args.length - 1; i += 2) {
      let rNumber = RNumber.parse(this.message.args[i + 1]);
      let flag = this.message.args[i];
      if (!rNumber) {
        response += `Please specify what amount you want ${flag} to be set to. ` + this.helpText;
        continue;
      }

      switch (flag.toLowerCase()) {
        case "minlength":
          guildController.setMinLength(rNumber.amount);
          response += `The minimum length for a message to be a paid is now ${rNumber.toString()} characters\n`;
          break;
        case "charvalue":
          guildController.setCharacterValue(rNumber.amount);
          response += `Messages over the minimum length earn ${rNumber.toString()} per character\n`;
          break;
        case "maxpayout":
          guildController.setMaxPayout(rNumber.amount);
          response += `The max value earned from a paid message is now ${rNumber.toString()}\n`;
          break;
        case "basepayout":
          guildController.setBasePayout(rNumber.amount);
          response += `Messages over the minimum length earn a base pay of ${rNumber.toString()}\n`;
          break;
        case "taxrate":
          rNumber.setType(RNumber.types.PERCENT);
          guildController.setTaxRate(rNumber.amount);
          response += `Members are taxed ${rNumber.toString()} of their role income on a weekly basis\n`;
          break;
        default:
          response += `Unknown parameter "${flag}"\n`;
      }
    }
    return this.inputChannel.watchSend(response);
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend(this.helpText);
  }
}

export default Economy;
