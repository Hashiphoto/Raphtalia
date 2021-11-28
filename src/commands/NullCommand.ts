import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class NullCommand extends Command<ICommandProps> {
  private text: string | undefined;

  public constructor(text?: string) {
    super();
    this.name = "NullCommand";
    this.text = text;
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member });
  }

  public async execute(): Promise<number | undefined> {
    await this.reply(this.text ?? "Error");
    return;
  }
}
