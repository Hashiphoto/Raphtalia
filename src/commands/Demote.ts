import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class Demote extends Command {
  /**
   * @deprecated
   */
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Demote**\nReduce the rank of the specified member(s) by one";
    this.usage = "Usage: `Demote @member`";
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

    const demotePromises = targets.map((target) => this.ec.memberController.demoteMember(target));

    return Promise.all(demotePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}
