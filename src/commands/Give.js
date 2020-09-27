import Discord from "discord.js";

import Command from "./Command.js";
import RNumber from "../structures/RNumber.js";
import CurrencyController from "../controllers/CurrencyController.js";
import MemberController from "../controllers/MemberController.js";

class Give extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {MemberController} memberController
   */
  constructor(message, currencyController, memberController) {
    super(message);
    this.currencyController = currencyController;
    this.memberController = memberController;
  }

  execute() {
    const targets = this.message.mentionedMembers;
    if (this.message.args.length === 0 || targets.length === 0) {
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
      return this.sendHelpMessage("Enter the amount you want to give in dollar format");
    }
    if (rNumber.amount < 0) {
      return this.memberController
        .addInfractions(this.message.sender)
        .then((feedback) =>
          this.inputChannel.watchSend("You cannot send a negative amount of money\n" + feedback)
        );
    }

    let totalAmount = rNumber.amount * targets.length;
    return this.currencyController.getCurrency(this.sender).then((balance) => {
      if (balance < totalAmount) {
        return this.inputChannel.watchSend(
          `You do not have enough money for that. ` +
            `Funds needed: ${RNumber.formatDollar(totalAmount)}`
        );
      }

      const givePromises = targets.map((target) => {
        return this.currencyController
          .transferCurrency(this.sender, target, rNumber.amount)
          .then(() => `Transfered ${rNumber.toString()} to ${target}!`);
      });

      return Promise.all(givePromises)
        .then((messages) => messages.reduce(this.sum))
        .then((response) => this.inputChannel.watchSend(response))
        .then(() => this.useItem(targets.length));
    });
  }

  sendHelpMessage(pretext = "") {
    return this.inputChannel.watchSend(`${pretext}\n` + "Usage: `Give @taget $1`");
  }
}

export default Give;
