import Command from "./Command";
import { GuildMember } from "discord.js";
import RoleService from "../services/Role.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Pardon extends Command {
  public constructor() {
    super();
    this.instructions =
      "**Pardon**\nRemoves all infractions from the specified member(s). " +
      "If the members are exiled, they are also freed from exile";
    this.usage = "Usage: `Pardon @member`";
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

    // Ensure exile role exists
    await RoleService.ensureExileRole(this.ec.guild);

    const pardonPromises = targets.map((target) => {
      return this.ec.memberController.pardonMember(target);
    });

    return Promise.all(pardonPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.reply(response))
      .then(() => this.useItem(targets.length));
  }
}
