import { Client } from "discord.js";
import ExecutionContext from "../models/ExecutionContext";
import RoleContestController from "../services/RoleContestController";

const resolveRoleContests = (client: Client) => {
  const guildContests = client.guilds.cache.map(async (guild) => {
    const context = new ExecutionContext(this.db, this.client, guild);
    const feedback = await new RoleContestController(context)
      .resolveRoleContests()
      .then((responses) => responses.reduce((prev, current) => prev + current, ""));
    if (feedback.length === 0) {
      return;
    }
    const outputChannel = await context.guildController.getOutputChannel();
    if (!outputChannel) {
      return;
    }
    outputChannel.send(feedback);
  });

  return Promise.all(guildContests);
};

export { resolveRoleContests };
