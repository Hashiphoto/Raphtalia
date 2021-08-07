/**
 * @todo Finish this
 */

import Command from "./Command";
import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Revolt extends Command {
  public constructor() {
    super();
    this.instructions = "**Revolt**\nDoesn't do anything";
    this.usage = "Usage: `Revolt`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    return this.reply("This feature hasn't been developed yet");
  }
}
