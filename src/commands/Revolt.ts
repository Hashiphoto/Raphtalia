/**
 * @todo Finish this
 */

import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Revolt extends Command<ICommandProps> {
  public constructor() {
    super();
    this.name = "Revolt";
    this.instructions = "Doesn't do anything";
    this.usage = "`Revolt`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    await this.reply("This feature hasn't been developed yet");
    return 1;
  }
}
