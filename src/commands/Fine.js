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
    const targets = this.message.mentionedMembers;

    if (!targets || targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.sender.hasAuthorityOver(targets)) {
      return this.memberController
        .addInfractions(this.sender)
        .then((feedback) =>
          this.inputChannel.watchSend(
            `You must hold a higher rank than the members you are fining\n` + feedback
          )
        );
    }

    let rNumber = RNumber.parse(this.message.content);
    if (!rNumber || (rNumber.type !== RNumber.types.DOLLAR && rNumber.type !== RNumber.types.INT)) {
      return this.sendHelpMessage("Please specify the amount to fine in dollar format");
    }

    const finePromises = targets.map((target) =>
      this.currencyController.transferCurrency(target, this.sender, rNumber.amount).then(() => {
        return `Fined ${target} ${rNumber.toString()}!\n`;
      })
    );

    return Promise.all(finePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem());
  }

  sendHelpMessage(pretext = "") {
    return this.inputChannel.watchSend(`${pretext}\n` + "Usage: `Fine @target $1`");
  }
}

export default Fine;
