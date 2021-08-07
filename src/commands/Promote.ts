import Command from "./Command";
import { GuildMember } from "discord.js";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Promote extends Command {
  public constructor() {
    super();
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    try {
      await this.ec.memberController.protectedPromote(initiator);
    } catch (error) {
      if (error.name === "MemberLimitError") {
        return this.reply(error.message);
      } else if (error instanceof RangeError) {
        return this.reply(error.message);
      } else if (error.result === Result.OnCooldown) {
        return this.reply(`This role cannot be contested yet`);
      } else {
        throw error;
      }
    }

    return this.useItem(initiator);
  }
}
