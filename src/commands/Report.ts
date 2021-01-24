import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Report extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions = "**Report**\nGive an infraction to the specified member";
    this.usage = "Usage: `Report @member`";
  }

  async execute(): Promise<any> {
    const targets = this.message.mentionedMembers;
    if (targets.length === 0) {
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
            `You must hold a higher rank than the members you are reporting\n` + feedback
          )
        );
    }

    const reportPromises = targets.map((target) => {
      return this.memberController.addInfractions(target);
    });

    return Promise.all(reportPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default Report;
