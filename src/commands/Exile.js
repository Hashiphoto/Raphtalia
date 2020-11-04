import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import Util from "../Util.js";
import MemberController from "../controllers/MemberController.js";

class Exile extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**Exile**\nPut a specified member in exile for a period of time. " +
      "Exiled members cannot use any commands. If no time is specified, the maximum value of 6 hours will be used. ";
    this.usage = "Usage: `Exile @member [1h 1m 1s]`";
  }

  async execute() {
    const targets = this.message.mentionedMembers;

    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    // Ensure exile role exists
    if (!this.guild.roles.cache.find((r) => r.name === "Exile")) {
      await this.guild.roles
        .create({ data: { name: "Exile", hoist: false, color: "#010000" } })
        .then((role) => {
          return role.setPosition(this.guild.roles.cache.size - 2);
        });
    }

    // Input or default 6 hours
    const duration =
      Util.parseTime(this.message.content) ?? dayjs.duration({ hours: 6 }).asMilliseconds();
    // Current time + exile duration
    const releaseDate = dayjs().add(duration);

    // Comment back in if exile should only affect lower rank targets
    // if (!this.sender.hasAuthorityOver(targets)) {
    //   return this.memberController
    //     .addInfractions(this.sender)
    //     .then((feedback) =>
    //       this.inputChannel.watchSend(
    //         `You must hold a higher rank than the members you are exiling\n` + feedback
    //       )
    //     );
    // }

    const response = targets.reduce(
      (sum, target) => sum + `${target} has been exiled until ${Util.formatDate(releaseDate)}`,
      ""
    );

    const exilePromises = targets.map((target) =>
      this.memberController.exileMember(target, duration).then((released) => {
        if (released) {
          return this.inputChannel.watchSend(`${target} has been released from exile!`);
        }
      })
    );

    Promise.all(exilePromises);

    return this.inputChannel.watchSend(response).then(() => this.useItem(targets.length));
  }
}

export default Exile;
