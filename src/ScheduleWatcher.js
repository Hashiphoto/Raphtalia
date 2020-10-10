import MemberController from "./controllers/MemberController.js";
import Discord from "discord.js";
import cron from "cron";
const { CronJob } = cron;
import Database from "./db/Database.js";

/**
  CRON Quick Refernce
    * * * * *
    | | | | |
    | | | | ----- Day of week (0 - 7) (Sunday=0 or 7)
    | | | ------- Month (1 - 12)
    | | --------- Day of month (1 - 31)
    | ----------- Hour (0 - 23)
    ------------- Minute (0 - 59)
    
    @yearly, @monthly, @weekly, @daily, @hourly,
  */
class ScheduleWatcher {
  /**
   * @param {Database} db
   * @param {Discord.Client} client
   */
  constructor(db, client) {
    this.db = db;
    this.client = client;
  }

  start() {
    // Every day at 8:00 PM
    new CronJob(
      "0 20 * * *",
      () => {
        const guildContests = this.client.guilds.map((guild) =>
          new MemberController(this.db, guild)
            .resolveRoleContests()
            .then((feedback) => feedback && guild.systemChannel.send(feedback))
        );

        return Promise.all(guildContests);
      },
      null,
      true,
      "America/Los_Angeles"
    );
  }
}

export default ScheduleWatcher;
