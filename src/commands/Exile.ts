import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import RoleUtil from "../RoleUtil";
import Util from "../Util";
import dayjs from "dayjs";

export default class Exile extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Exile**\nPut a specified member in exile for a period of time. " +
      "Exiled members cannot use any commands. If no time is specified, the maximum value of 6 hours will be used. ";
    this.usage = "Usage: `Exile @member [1h 1m 1s]`";
  }

  public async execute() {
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

    // Ensure exile role exists
    await RoleUtil.ensureExileRole(this.ec.guild);

    // Input or default 6 hours
    const duration =
      Util.parseTime(this.ec.messageHelper.parsedContent) ??
      dayjs.duration({ hours: 6 }).asMilliseconds();
    // Current time + exile duration
    const releaseDate = dayjs().add(duration);

    // Comment back in if exile should only affect lower rank targets
    // if (!this.sender.hasAuthorityOver(targets)) {
    //   return this.memberController
    //     .addInfractions(this.sender)
    //     .then((feedback) =>
    //       this.ec.channelHelper.watchSend(
    //         `You must hold a higher rank than the members you are exiling\n` + feedback
    //       )
    //     );
    // }

    const response = targets.reduce(
      (sum, target) =>
        sum + `${target.toString()} has been exiled until ${Util.formatDate(releaseDate)}`,
      ""
    );

    const exilePromises = targets.map((target) =>
      this.ec.memberController.exileMember(target, duration).then((released) => {
        if (released) {
          return this.ec.channelHelper.watchSend(
            `${target.toString()} has been released from exile!`
          );
        }
      })
    );

    Promise.all(exilePromises);

    return this.ec.channelHelper.watchSend(response).then(() => this.useItem(targets.length));
  }
}
