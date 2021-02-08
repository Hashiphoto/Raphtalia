import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import RNumber from "../structures/RNumber";

/**
 * @deprecated
 */
export default class Fine extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Fine**\nSubtract an amount of money from the member(s) specified and give it to yourself";
    this.usage = "Usage: `Fine @member $1`";
  }

  public async execute() {
    const targets = this.ec.messageHelper.mentionedMembers;

    if (!targets || targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    if (!this.ec.memberController.hasAuthorityOver(this.ec.initiator, targets)) {
      return this.ec.memberController
        .addInfractions(this.ec.initiator)
        .then((feedback) =>
          this.ec.channelHelper.watchSend(
            `You must hold a higher rank than the members you are fining\n` + feedback
          )
        );
    }

    const rNumber = RNumber.parse(this.ec.messageHelper.parsedContent);
    if (!rNumber || (rNumber.type !== RNumber.Types.DOLLAR && rNumber.type !== RNumber.Types.INT)) {
      return this.sendHelpMessage("Please specify the amount to fine in dollar format");
    }

    const finePromises = targets.map((target) =>
      this.ec.currencyController
        .transferCurrency(target, this.ec.initiator, rNumber.amount)
        .then(() => {
          return `Fined ${target.toString()} ${rNumber.toString()}!\n`;
        })
    );

    return Promise.all(finePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}
