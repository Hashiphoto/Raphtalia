import Command from "./Command";
import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Headpat extends Command {
  public constructor() {
    super();
    this.instructions = "**Headpat**\nI will give a headpat to the member(s) is specified";
    this.usage = "Usage: `Headpat @member`";
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

    let response = "";
    for (const member of targets) {
      response += `${member.toString()} headpat\n`;
    }

    return this.reply(response).then(() => this.useItem(targets.length));
  }
}
