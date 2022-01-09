import { Message, TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import Admin from "../commands/admin/Admin";
import AutoDelete from "../commands/admin/AutoDelete";
import BanList from "../commands/admin/BanList";
import Censorship from "../commands/admin/Censorship";
import Roles from "../commands/admin/Roles";
import ServerStatus from "../commands/admin/ServerStatus";
import Store from "../commands/admin/Store";
import Command from "../commands/Command";
import Debug from "../commands/Debug";
import NullCommand from "../commands/NullCommand";
import AllowWord from "../commands/public/AllowWord";
import Balance from "../commands/public/Balance";
import BanWord from "../commands/public/BanWord";
import Buy from "../commands/public/Buy";
import Exile from "../commands/public/Exile";
import Give from "../commands/public/Give";
import Headpat from "../commands/public/Headpat";
import Help from "../commands/public/Help";
import HoldVote from "../commands/public/HoldVote";
import Infractions from "../commands/public/Infractions";
import Pardon from "../commands/public/Pardon";
import Play from "../commands/public/Play";
import Poke from "../commands/public/Poke";
import Promote from "../commands/public/Promote";
import Register from "../commands/public/Register";
import Scan from "../commands/public/Scan";
import Screening from "../commands/public/Screening";
import Status from "../commands/public/Status";
import Steal from "../commands/public/Steal";
import Take from "../commands/Take";
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
    if (!cmdMessage.message.guild || !cmdMessage.message.member) {
      return new NullCommand("Commands can only be used in a server text channel");
    }
    // Check for exile
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
    return CommandService.AllCommands.find((command) =>
      command.aliases.includes(name.toLowerCase())
    );
  }

  public static AllCommands: Command<ICommandProps>[] = [
    new Admin(),
    new AllowWord(),
    new AutoDelete(),
    new Balance(),
    new BanList(),
    new BanWord(),
    new Buy(),
    new Censorship(),
    new Debug(),
    new Exile(),
    new Give(),
    new Headpat(),
    new Help(),
    new HoldVote(),
    new Infractions(),
    new Pardon(),
    new Play(),
    new Poke(),
    new Promote(),
    new Register(),
    new Roles(),
    new Scan(),
    new Screening(),
    new ServerStatus(),
    new Status(),
    new Steal(),
    new Store(),
    new Take(),
  ];
}
