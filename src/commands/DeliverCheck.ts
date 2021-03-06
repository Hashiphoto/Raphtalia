import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import RNumber from "../structures/RNumber";

export default class DeliverCheck extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**DeliverCheck**\nGenerate money out of thin air and give it to the member(s) specified";
    this.usage = "Usage: `DeliverCheck @member $1`";
  }

  public async execute(): Promise<any> {
    const targets = this.ec.messageHelper.mentionedMembers;
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let rNumber = RNumber.parse(this.ec.messageHelper.parsedContent);
    if (!rNumber) {
      return this.sendHelpMessage();
    }

    let promises = [];
    for (const target of targets) {
      promises.push(this.ec.currencyController.addCurrency(target, rNumber.amount));
    }

    return Promise.all(promises)
      .then(() => this.ec.channelHelper.watchSend("Money has been distributed!"))
      .then(() => this.useItem(promises.length));
  }
}
