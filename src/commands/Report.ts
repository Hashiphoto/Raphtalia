import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";

/**
 * @deprecated
 */
export default class Report extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Report**\nGive an infraction to the specified member";
    this.usage = "Usage: `Report @member`";
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

    if (!this.ec.memberController.hasAuthorityOver(this.ec.initiator, targets)) {
      return this.ec.memberController
        .addInfractions(this.ec.initiator)
        .then((feedback) =>
          this.ec.channelHelper.watchSend(
            `You must hold a higher rank than the members you are reporting\n` + feedback
          )
        );
    }

    const reportPromises = targets.map((target) => {
      return this.ec.memberController.addInfractions(target);
    });

    return Promise.all(reportPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}
