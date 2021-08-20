import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommandService from "../services/Command.service";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

enum Args {
  COMMAND_NAME,
}

@autoInjectable()
export default class Help extends Command {
  public constructor(private _commandService?: CommandService) {
    super();
    this.instructions = "**Help**\nGet detailed information about how to use any other command";
    this.usage = "Usage: `Help (command name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage(this.instructions);
      return;
    }
    return this.execute(cmdMessage.message.member, cmdMessage.args[Args.COMMAND_NAME]);
  }

  public async execute(initiator: GuildMember, commandName: string): Promise<any> {
    const command = this._commandService?.getCommandByName(
      commandName.toLowerCase().replace(/!/, "")
    );

    if (!command) {
      return this.sendHelpMessage();
    }

    await command.sendHelpMessage(command.instructions);
    await this.useItem(initiator);
  }
}
