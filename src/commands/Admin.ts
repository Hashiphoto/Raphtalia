import { ApplicationCommandData, Guild as DsGuild, TextChannel } from "discord.js";

import { AllCommands } from "./CommandList";
import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

export enum AdminCommand {
  Setup = "Setup",
}

interface IAdminProps extends ICommandProps {
  adminCommand: AdminCommand;
}

@autoInjectable()
export default class Admin extends Command<IAdminProps> {
  public constructor() {
    super();
    this.name = "Admin";
    this.instructions = "Perform an administrative action";
    this.usage = "`Admin command [args]`";
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

    switch (cmdMessage.args[0].toLowerCase()) {
      case "setup":
        return this.runWithItem({
          initiator: cmdMessage.message.member,
          adminCommand: AdminCommand.Setup,
        });
      default:
        this.sendHelpMessage(`Unknown command ${cmdMessage.args[0]}`);
        return;
    }
  }

  public async execute(props: IAdminProps): Promise<number | undefined> {
    const { initiator, adminCommand } = props;
    switch (adminCommand) {
      case AdminCommand.Setup:
        await this.setup(initiator.guild);
        break;
    }
    return 1;
  }

  /**
   * Insert every slash command into the guild
   */
  private async setup(guild: DsGuild) {
    const slashCommands: ApplicationCommandData[] = [];
    AllCommands.forEach((command) => slashCommands.push(...command.slashCommands));
    await guild.commands.set(slashCommands);
    this.reply(`Set commands: ${slashCommands.map((s) => `\`${s.name}\``).join(", ")}`);
  }
}
