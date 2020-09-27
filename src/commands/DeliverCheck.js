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
    const targets = this.message.mentionedMembers;
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let rNumber = RNumber.parse(this.message.content);
    if (!rNumber) {
      return this.sendHelpMessage();
    }

    let promises = [];
    for (const target of targets) {
      promises.push(this.currencyController.addCurrency(target, rNumber.amount));
    }

    return Promise.all(promises)
      .then(() => this.inputChannel.watchSend("Money has been distributed!"))
      .then(() => this.useItem(promises.length));
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `DeliverCheck @target $1`");
  }
}

export default DeliverCheck;
