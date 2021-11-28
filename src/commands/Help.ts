import { TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import { IArgProps } from "../interfaces/CommandInterfaces";
import CommandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import CommandService from "../services/Command.service";
import Command from "./Command";

enum Args {
  COMMAND_NAME,
}

@autoInjectable()
export default class Help extends Command<IArgProps> {
  public constructor(
    @inject(delay(() => CommandService)) private _commandService?: CommandService
  ) {
    super();
    this.name = "Help";
    this.instructions = "Get detailed information about how to use any other command";
    this.usage = "`Help (command name)`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage(this.instructions);
      return;
    }
    await this.runWithItem({
      initiator: cmdMessage.message.member,
      arg: cmdMessage.args[Args.COMMAND_NAME],
    });
  }

  public async execute({ arg: commandName }: IArgProps): Promise<number | undefined> {
    const command = this._commandService?.getCommandByName(
      commandName.toLowerCase().replace(/!/, "")
    );

    if (!command) {
      await this.sendHelpMessage();
      return;
    }
    command.channel = this.channel;
    await command.sendHelpMessage(command.instructions);
    return 1;
  }
}
