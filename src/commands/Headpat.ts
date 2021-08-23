import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Headpat extends Command {
  public constructor() {
    super();
    this.name = "Headpat";
    this.instructions = "**Headpat**\nI will give a headpat to the member(s) is specified";
    this.usage = "Usage: `Headpat @member`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.memberMentions);
  }

  public async execute(initiator: GuildMember, targets: GuildMember[]): Promise<any> {
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

    return this.reply(response).then(() => this.useItem(initiator, targets.length));
  }
}
