/**
 * @deprecated
 */

import Command from "./Command";
import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Report extends Command {
  public constructor() {
    super();
    this.instructions = "**Report**\nGive an infraction to the specified member";
    this.usage = "Usage: `Report @member`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    const targets = this.ec.messageHelper.mentionedMembers;
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    if (!this.ec.memberController.hasAuthorityOver(initiator, targets)) {
      return this.ec.memberController
        .addInfractions(initiator)
        .then((feedback) =>
          this.reply(`You must hold a higher rank than the members you are reporting\n` + feedback)
        );
    }

    const reportPromises = targets.map((target) => {
      return this.ec.memberController.addInfractions(target);
    });

    return Promise.all(reportPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.reply(response))
      .then(() => this.useItem(targets.length));
  }
}
