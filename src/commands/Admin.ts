import { ApplicationCommandData, Guild as DsGuild, GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import Command from "./Command";
import { AllCommands } from "./CommandList";

export enum AdminCommand {
  Setup = "Setup",
}

@autoInjectable()
export default class Admin extends Command {
  public constructor() {
    super();
    this.name = "Admin";
    this.instructions = "Perform an administrative action";
    this.usage = "`Admin command [args]`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
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
        return this.run(cmdMessage.message.member, AdminCommand.Setup);
      default:
        this.sendHelpMessage(`Unknown command ${cmdMessage.args[0]}`);
        return;
    }
  }

  public async execute(
    initiator: GuildMember,
    adminCommand: AdminCommand
  ): Promise<number | undefined> {
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
    return guild.commands.set(slashCommands);
  }
}
