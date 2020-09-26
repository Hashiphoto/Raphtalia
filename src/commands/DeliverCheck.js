import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";

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
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    let rNumber = RNumber.parse(this.message.content);
    if (!rNumber) {
      return this.sendHelpMessage();
    }

    let promises = [];
    for (const target of this.message.mentionedMembers) {
      promises.push(this.currencyController.addCurrency(target, rNumber.amount));
    }

    return Promise.all(promises)
      .then(() => this.inputChannel.watchSend("Money has been distributed!"))
      .then(() => this.useItem());
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `DeliverCheck @target $1`");
  }
}

export default DeliverCheck;
