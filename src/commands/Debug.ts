import { autoInjectable, container } from "tsyringe";

import ClientService from "../services/Client.service";
import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import DecayItemsJob from "../jobs/DecayItemsJob";
import GuildService from "../services/Guild.service";
import { IArgsProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import RoleContestService from "../services/RoleContest.service";
import RoleRepository from "../repositories/Role.repository";
import RoleService from "../services/Role.service";
import { TextChannel } from "discord.js";
import TrendsService from "../services/Trends.service";
import dayjs from "dayjs";

@autoInjectable()
export default class Debug extends Command<IArgsProps> {
  public constructor() {
    super();
    this.name = "Debug";
    this.instructions = "For testing in development only";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute({ initiator, args }: IArgsProps): Promise<number | undefined> {
    const guild = initiator.guild;
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
        const clientService = container.resolve(ClientService);
        const client = clientService.getClient();
        container.resolve(DecayItemsJob).run(client);
        this.queueReply("Removed expired items");
        break;
      }
      case "showcontest": {
        const contestId = Number(args[1]);
        const roleRepository = container.resolve(RoleRepository);
        const roleContestService = container.resolve(RoleContestService);
        const guildService = container.resolve(GuildService);
        const contest = await roleRepository.getRoleContest(contestId, true);
        if (!contest) {
          this.queueReply(`No contest with id ${contestId} exists`);
          break;
        }
        const contestedRole = await guild.roles.fetch(contest.roleId, { force: true });
        const contestInitiator = await guild.members.fetch({
          user: contest.initiatorId,
          force: true,
        });
        if (!contestedRole || !contestInitiator) {
          this.queueReply(
            (contestedRole ? "" : `Could not find role ${contest.roleId}. `) +
              (contestInitiator ? "" : `Could not find member ${contest.initiatorId}`)
          );
          break;
        }
        const messageOptions = await roleContestService.createContestMessage(
          contestedRole,
          contestInitiator,
          dayjs(contest.startDate)
        );
        const outputChannel = await guildService.getOutputChannel(initiator.guild);
        if (!outputChannel) {
          this.queueReply("No output channel set");
          break;
        }
        const message = await outputChannel.send(messageOptions);
        this.queueReply(`Created new contest status message with id: ${message.id}`);
        break;
      }
      case "search": {
        const trendsService = container.resolve(TrendsService);
        const results = await trendsService.getInterestOverTime(args.slice(2), args[1] as any);
        this.queueReply("```json\n" + JSON.stringify(results, null, 2) + "\n```");
        break;
      }
      default:
        await this.sendHelpMessage();
    }
  }
}
