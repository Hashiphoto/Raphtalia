import Discord from "discord.js";

import Command from "./Command.js";
import { extractNumber } from "../controllers/format.js";

class Economy extends Command {
  execute() {
    if (!this.message.args || this.message.args.length <= 1) {
      return this.inputChannel.watchSend(
        "Usage: `Economy [MinLength 1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`"
      );
    }

    for (let i = 0; i < this.message.args.length - 1; i += 2) {
      let amount = extractNumber(this.message.args[i + 1]).number;
      if (amount == null)
        return this.inputChannel.watchSend("Could not understand arguments");

      switch (this.message.args[i].toLowerCase()) {
        case "minlength":
          this.db.guilds.setMinLength(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `The minimum length for a this.message to be a paid is now ${amount.toFixed(
              0
            )} characters`
          );
          break;
        case "charvalue":
          this.db.guilds.setCharacterValue(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `Messages over the minimum length earn $${amount.toFixed(
              2
            )} per character`
          );
          break;
        case "maxpayout":
          this.db.guilds.setMaxPayout(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `The max value earned from a paid this.message is now $${amount.toFixed(
              2
            )}`
          );
          break;
        case "basepayout":
          this.db.guilds.setBasePayout(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `Messages over the minimum length earn a base pay of $${amount.toFixed(
              2
            )}`
          );
          break;
        case "taxrate":
          this.db.guilds.setTaxRate(this.message.guild.id, amount / 100);
          this.inputChannel.watchSend(
            `Members are taxed ${amount.toFixed(
              2
            )}% of their role income on a weekly basis`
          );
          break;
      }
    }
  }
}

export default Economy;
