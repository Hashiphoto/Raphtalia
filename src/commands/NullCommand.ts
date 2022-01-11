import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";

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
    this.channel = cmdMessage.message.channel;
    // We don't call runWithItem since the user might not have
    // the right item, or they could be in exile
    await this.execute();
  }

  public async execute(): Promise<number | undefined> {
    this.reply(this.text ?? "Error");
    return;
  }
}
