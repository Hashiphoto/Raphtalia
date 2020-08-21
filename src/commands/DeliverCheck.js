import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";

class DeliverCheck extends Command {
  execute() {
    if (
      this.message.mentionedMembers.length === 0 ||
      !this.message.args ||
      this.message.args.length < 2
    ) {
      return this.sendHelpMessage();
    }

    let rNumber = new RNumber().parse(this.message.args[this.message.args.length - 1]);
    if (rNumber.amount == null) {
      return this.sendHelpMessage();
    }

    let currencyController = new CurrencyController(this.db, this.guild);

    this.message.mentionedMembers.forEach((target) => {
      currencyController.addCurrency(target, rNumber.amount);
    });

    return this.inputChannel.watchSend("Money has been distributed!");
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `DeliverCheck @target $1`");
  }
}

export default DeliverCheck;
