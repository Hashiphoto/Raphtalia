import { Client } from "discord.js";
import GuildService from "../services/Guild.service";
import Job from "./Job";
import RoleContestService from "../services/RoleContest.service";
import { injectable } from "tsyringe";

@injectable()
export default class ResolveContestsJob implements Job {
  public constructor(
    private _roleContestService: RoleContestService,
    private _guildService: GuildService
  ) {}

  public async run(client: Client): Promise<void> {
    const guildContests = client.guilds.cache.map(async (guild) => {
      const feedback = await this._roleContestService
        .resolveRoleContests(guild)
        .then((responses) => responses.reduce((prev, current) => prev + current, ""));
      if (feedback.length === 0) {
        return;
      }
      const outputChannel = await this._guildService.getOutputChannel(guild);
      if (!outputChannel) {
        return;
      }
      outputChannel.send(feedback);
    });

    await Promise.all(guildContests);
  }
}
