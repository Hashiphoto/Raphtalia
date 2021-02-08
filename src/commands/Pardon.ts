import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import RoleUtil from "../RoleUtil";

export default class Pardon extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Pardon**\nRemoves all infractions from the specified member(s). " +
      "If the members are exiled, they are also freed from exile";
    this.usage = "Usage: `Pardon @member`";
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

    // Ensure exile role exists
    await RoleUtil.ensureExileRole(this.ec.guild);

    const pardonPromises = targets.map((target) => {
      return this.ec.memberController.pardonMember(target);
    });

    return Promise.all(pardonPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem(targets.length));
  }
}
