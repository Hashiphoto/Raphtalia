import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, container } from "tsyringe";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import RoleContestService from "../services/RoleContest.service";
import RoleService from "../services/Role.service";

@autoInjectable()
export default class Debug extends Command {
  public constructor() {
    super();
    this.name = "Debug";
    this.instructions = "For testing in development only";
    this.usage = "Usage: `Debug (options)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, args: string[]): Promise<any> {
    switch (args[0].toLowerCase()) {
      case "resolvecontests": {
        const roleContestService = container.resolve(RoleContestService);
        const feedback = await roleContestService
          .resolveRoleContests(initiator.guild, true)
          .then((responses) => responses.join(""));
        if (feedback.length === 0) {
          return;
        }
        this.reply(feedback);
        break;
      }
      case "resetrole": {
        const roleService = container.resolve(RoleService);
        const role = roleService.convertToRole(initiator.guild, args[1]);
        if (!role) {
          this.reply(`Cannot find role ${args[1]}`);
          return;
        }
        await roleService.resetRoleDates(role);
        this.reply("Completed");
        break;
      }
      default:
        return this.sendHelpMessage();
    }
  }
}
