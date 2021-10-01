import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import Command from "./Command";

@autoInjectable()
export default class NullCommand extends Command {
  private text: string | undefined;

  public constructor(text?: string) {
    super();
    this.name = "NullCommand";
    this.text = text;
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<number | undefined> {
    await this.reply(this.text ?? "Error");
    return;
  }
}
