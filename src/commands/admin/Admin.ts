import {
  ApplicationCommandData,
  ApplicationCommandPermissionData,
  Guild as DsGuild,
  TextChannel,
} from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../../enums/Result";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import RaphError from "../../models/RaphError";
import CommandService from "../../services/Command.service";
import RoleService from "../../services/Role.service";
import Command from "../Command";

export enum AdminCommand {
  Setup = "setup",
}

interface IAdminProps extends ICommandProps {
  adminCommand: string;
}

@autoInjectable()
export default class Admin extends Command<IAdminProps> {
  public constructor(
    @inject(delay(() => CommandService)) private _commandService?: CommandService,
    @inject(delay(() => RoleService)) private _roleService?: RoleService
  ) {
    super();
    this.name = "Admin";
    this.instructions = "Perform an administrative action";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    if (!cmdMessage.args.length) {
      this.sendHelpMessage();
      return;
    }

    return this.runWithItem({
      initiator: cmdMessage.message.member,
      adminCommand: cmdMessage.args[0].toLowerCase(),
    });
  }

  public async execute({ initiator, adminCommand }: IAdminProps): Promise<number | undefined> {
    switch (adminCommand) {
      case AdminCommand.Setup:
        await this.setup(initiator.guild);
        break;
      default:
        this.sendHelpMessage(`Unknown command ${adminCommand}`);
        return;
    }
    return 1;
  }

  /**
   * Insert every slash command into the guild
   */
  private async setup(guild: DsGuild) {
    // Upsert all slash commands
    const slashCommands: ApplicationCommandData[] = [];
    const leaderOnlyCommands: Command<ICommandProps>[] = [];
    this._commandService?.allCommands.forEach((command) => {
      slashCommands.push(...command.slashCommands);
      if (command.leaderOnly) {
        leaderOnlyCommands.push(command);
      }
    });
    await guild.commands.set(slashCommands);

    // Give specific permissions
    const leaderRole = this._roleService?.getLeaderRole(guild);
    console.log(`leaderRole is ${leaderRole?.name}`);
    if (leaderRole) {
      const liveSlashCommands = await guild.commands.fetch();
      const leaderPermission = {
        id: leaderRole.id,
        type: "ROLE",
        permission: true,
      } as ApplicationCommandPermissionData;

      await Promise.all(
        leaderOnlyCommands.map(async (command) => {
          for (const slashCommand of command.slashCommands) {
            const liveSlashCommand = liveSlashCommands.find((c) => c.name === slashCommand.name);
            liveSlashCommand?.permissions.set({
              permissions: [leaderPermission],
            });
          }
        })
      );
    }

    this.queueReply(`Set commands: ${slashCommands.map((s) => `\`${s.name}\``).join(", ")}`);
  }
}
