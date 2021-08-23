/**
 * @todo Finish this
 */

import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Revolt extends Command {
  public constructor() {
    super();
    this.name = "Revolt";
    this.instructions = "**Revolt**\nDoesn't do anything";
    this.usage = "Usage: `Revolt`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    return this.reply("This feature hasn't been developed yet");
  }
}
