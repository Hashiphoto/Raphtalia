import Command from "./Command";
import ExecutionContext from "../models/ExecutionContext";
import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class NullCommand extends Command {
  private text: string | undefined;

  public constructor(context: ExecutionContext, text?: string) {
    super();
    this.text = text;
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    return this.reply(this.text ?? "Error");
  }
}
