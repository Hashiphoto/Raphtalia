import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";

/**
 * @deprecated
 */
export default class SoftKick extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**SoftKick**\nKick the specified member(s) and also send them an invite back to the server";
    this.usage = "Usage: `SoftKick @member [for reason]`";
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
            `You must hold a higher rank than the members you are demoting\n` + feedback
          )
        );
    }

    const softPromises = targets.map((target) => {
      let reason = undefined;
      const matches = this.ec.messageHelper.parsedContent.match(/for\s+.*/i);
      if (matches) {
        reason = matches[0];
      }

      return this.ec.memberController.softKick(target, reason, this.ec.initiator);
    });

    return Promise.all(softPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}
