import { Message, TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import Command from "../commands/Command";
import { AllCommands } from "../commands/CommandList";
import NullCommand from "../commands/NullCommand";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import CommandMessage from "../models/CommandMessage";
import ChannelService from "./Channel.service";
import RoleService from "./Role.service";

@injectable()
export default class CommandService {
  public constructor(
    @inject(RoleService) private _roleService: RoleService,
    @inject(ChannelService) private _channelService: ChannelService
  ) {}

  public async processMessage(message: Message): Promise<void> {
    const cmdMessage = new CommandMessage(message);
    const command = await this.selectCommand(cmdMessage);
    console.log(message.author.username, message.author.id, command.name, cmdMessage.args);
    await this.executeCommand(cmdMessage, command);
  }

  private async selectCommand(cmdMessage: CommandMessage): Promise<Command<ICommandProps>> {
    // Check for exile
    if (!cmdMessage.message.guild || !cmdMessage.message.member) {
      return new NullCommand("Commands can only be used in a server text channel");
    }
    const exileRole = await this._roleService.getCreateExileRole(cmdMessage.message.guild);
    if (cmdMessage.message.member?.roles.cache.find((r) => r.id === exileRole.id)) {
      return new NullCommand(`You cannot use commands while in exile`);
    }

    // Get the command
    const command =
      this.getCommandByName(cmdMessage.command) ??
      new NullCommand(`Unknown command "${cmdMessage.command}"`);

    return command;
  }

  private async executeCommand(cmdMessage: CommandMessage, command: Command<ICommandProps>) {
    cmdMessage.message.channel.sendTyping();
    try {
      await command.runFromCommand(cmdMessage);
    } catch (error) {
      console.error(error);
      cmdMessage.message.channel.isText() &&
        (await this._channelService.watchSend(
          cmdMessage.message.channel as TextChannel,
          error.message
        ));
      return cmdMessage.message.react("🛑");
    }
  }

  public getCommandByName(name: string): Command<ICommandProps> | undefined {
    return AllCommands.find((command) => command.aliases.includes(name.toLowerCase()));
  }
}
