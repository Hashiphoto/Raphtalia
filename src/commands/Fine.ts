import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import Discord from "discord.js";
import MemberController from "../controllers/MemberController.js";
import RNumber from "../structures/RNumber.js";

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
    this.instructions =
      "**Fine**\nSubtract an amount of money from the member(s) specified and give it to yourself";
    this.usage = "Usage: `Fine @member $1`";
  }

  execute(): Promise<any> {
    const targets = this.message.mentionedMembers;

    if (!targets || targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    if (!this.sender.hasAuthorityOver(targets)) {
      return this.memberController
        .addInfractions(this.sender)
        .then((feedback) =>
          this.ec.channelHelper.watchSend(
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
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default Fine;
