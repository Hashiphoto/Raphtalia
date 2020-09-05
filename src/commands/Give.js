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
    if (!this.message.args || this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    let rNumber = RNumber.parse(this.message.content);
    if (rNumber.amount < 0) {
      return this.memberController
        .addInfractions(this.message.sender)
        .then((feedback) =>
          this.inputChannel.watchSend("You cannot send a negative amount of money\n" + feedback)
        );
    }

    let totalAmount = rNumber.amount * this.message.mentionedMembers.length;
    this.currencyController.getCurrency(this.sender).then((balance) => {
      if (balance < totalAmount) {
        return this.inputChannel.watchSend("You do not have enough money for that");
      }

      this.message.mentionedMembers.forEach((target) => {
        this.currencyController.transferCurrency(this.sender, target, rNumber.amount);
      });
      this.inputChannel.watchSend("Money transferred!");
    });
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Give @taget $1`");
  }
}

export default Give;
