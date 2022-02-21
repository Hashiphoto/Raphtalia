import { TextChannel } from "discord.js";
import { autoInjectable, container } from "tsyringe";
import { Env } from "../enums/Environment";
import { Result } from "../enums/Result";
import { IArgsProps } from "../interfaces/CommandInterfaces";
import DecayItemsJob from "../jobs/DecayItemsJob";
import CommandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import ClientService from "../services/Client.service";
import RoleService from "../services/Role.service";
import RoleContestService from "../services/RoleContest.service";
import Command from "./Command";
import NullCommand from "./NullCommand";

@autoInjectable()
export default class Debug extends Command<IArgsProps> {
  public constructor() {
    super();
    this.name = "Debug";
    this.instructions = "For testing in development only";
    this.aliases = [this.name.toLowerCase()];

    if (process.env.NODE_ENV !== Env.Dev) {
      return new NullCommand();
    }
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute({ initiator, args }: IArgsProps): Promise<number | undefined> {
    switch (args[0].toLowerCase()) {
      case "resolvecontests": {
        const roleContestService = container.resolve(RoleContestService);
        const feedback = await roleContestService
          .resolveRoleContests(initiator.guild, true)
          .then((responses) => responses.join(""));
        if (feedback.length === 0) {
          return;
        }
        this.queueReply(feedback);
        break;
      }
      case "resetrole": {
        const roleService = container.resolve(RoleService);
        const role = roleService.convertToRole(initiator.guild, args[1]);
        if (!role) {
          this.queueReply(`Cannot find role ${args[1]}`);
          return;
        }
        await roleService.resetRoleDates(role);
        this.queueReply("Completed");
        break;
      }
      case "decayitems": {
        this.queueReply("Hi");
        const clientService = container.resolve(ClientService);
        const client = clientService.getClient();
        container.resolve(DecayItemsJob).run(client);
        break;
      }
      default:
        await this.sendHelpMessage();
    }
  }
}
