import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import Command from "./Command";

@autoInjectable()
export default class Headpat extends Command {
  public constructor() {
    super();
    this.name = "Headpat";
    this.instructions = "I will give a headpat to the member(s) is specified";
    this.usage = "`Headpat @member`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member, cmdMessage.memberMentions);
  }

  public async execute(
    initiator: GuildMember,
    targets: GuildMember[]
  ): Promise<number | undefined> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    let response = "";
    for (const member of targets) {
      response += `${member.toString()} headpat\n`;
    }

    this.reply(response);
    return targets.length;
  }
}
