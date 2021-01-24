import Command from "./Command.js";
import Discord from "discord.js";
import MemberController from "../controllers/MemberController.js";
import dayjs from "dayjs";

class Pardon extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**Pardon**\nRemoves all infractions from the specified member(s). " +
      "If the members are exiled, they are also freed from exile";
    this.usage = "Usage: `Pardon @member`";
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

    // Ensure exile role exists
    if (!this.guild.roles.find((r) => r.name === "Exile")) {
      await this.guild
        .createRole({ name: "Exile", hoist: false, color: "#010000" })
        .then((role) => {
          return role.setPosition(this.guild.roles.size - 2);
        });
    }

    const pardonPromises = targets.map((target) => {
      return this.memberController.pardonMember(target, this.inputChannel);
    });

    return Promise.all(pardonPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}

export default Pardon;
