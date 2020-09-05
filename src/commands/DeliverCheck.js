import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";

class DeliverCheck extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   */
  constructor(message, currencyController) {
    super(message);
    this.currencyController = currencyController;
  }

  execute() {
    if (
      this.message.mentionedMembers.length === 0 ||
      !this.message.args ||
      this.message.args.length < 2
    ) {
      return this.sendHelpMessage();
    }

    let rNumber = RNumber.parse(this.message.args[this.message.args.length - 1]);
    if (!rNumber) {
      return this.sendHelpMessage();
    }

    this.message.mentionedMembers.forEach((target) => {
      this.currencyController.addCurrency(target, rNumber.amount);
    });

    return this.inputChannel.watchSend("Money has been distributed!");
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `DeliverCheck @target $1`");
  }
}

export default DeliverCheck;
