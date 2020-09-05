import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";
import MemberController from "../controllers/MemberController.js";

class Fine extends Command {
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
    if (!this.message.mentionedMembers || this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    let rNumber = RNumber.parse(this.message.content);
    if (!rNumber.amount) {
      return this.sendHelpMessage();
    }

    let response = "";

    // TODO: Create a money account for the guild that most of it goes into
    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      let target = this.message.mentionedMembers[i];
      if (!this.memberController.hasAuthorityOver(this.sender, target)) {
        this.memberController
          .addInfractions(this.sender)
          .then(
            (feedback) =>
              (response += `You must hold a higher rank than ${target} to fine them\n${feedback}\n`)
          );
        break;
      }
      this.currencyController.transferCurrency(target, this.sender, rNumber.amount);
      response += `Fined ${target} ${rNumber.toString()}\n`;
    }

    return this.inputChannel.watchSend(response);
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Fine @target $1`");
  }
}

export default Fine;
