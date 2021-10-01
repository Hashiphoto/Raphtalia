/**
 * @todo Finish this
 */

import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import Command from "./Command";

@autoInjectable()
export default class Revolt extends Command {
  public constructor() {
    super();
    this.name = "Revolt";
    this.instructions = "Doesn't do anything";
    this.usage = "`Revolt`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<number | undefined> {
    await this.reply("This feature hasn't been developed yet");
    return 1;
  }
}
