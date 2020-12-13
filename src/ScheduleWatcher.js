import Database from "./db/Database.js";
import Discord from "discord.js";
import MemberController from "./controllers/MemberController.js";
import RNumber from "./structures/RNumber.js";
import StoreStatusController from "./controllers/message/StoreStatusController.js";
import cron from "cron";
import dayjs from "dayjs";

const { CronJob } = cron;

/**
  CRON Quick Refernce
    * * * * *
    │ │ │ │ └ Day of week (0 - 7) (Sunday=0 or 7)
    │ │ │ └── Month (1 - 12)
    │ │ └──── Day of month (1 - 31)
    │ └────── Hour (0 - 23)
    └──────── Minute (0 - 59)
    
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
    this.timezone = "America/Los_Angeles";
  }

  start() {
    // Every day at 08:00 PM
    new CronJob("0 20 * * *", () => this.resolveRoleContests(), null, true, this.timezone);

    // Every day at 06:30 AM
    new CronJob("30 6 * * *", () => this.dropStorePrices(), null, true, this.timezone);
  }

  resolveRoleContests() {
    const guildContests = this.client.guilds.cache.map((guild) =>
      new MemberController(this.db, guild)
        .resolveRoleContests()
        .then((feedback) => feedback && guild.systemChannel.send(feedback))
    );

    return Promise.all(guildContests);
  }

  dropStorePrices() {
    const guildStoreUpdates = this.client.guilds.cache.map(async (guild) => {
      const dbGuild = await this.db.guilds.get(guild.id);

      return this.db.inventory
        .getGuildStock(guild.id)
        .then(async (guildItems) => {
          for (const item of guildItems) {
            // Don't let sold-out items depreciate for no reason
            if (item.soldInCycle !== 0 || item.quantity === 0) {
              continue;
            }
            const hoursSinceLastSold = dayjs
              .duration(dayjs().diff(dayjs(item.dateLastSold)))
              .asHours();
            const daysSinceLastSold = Math.floor(hoursSinceLastSold / 24);
            const salePercentage =
              Math.ceil(daysSinceLastSold / dbGuild.priceDropDays) * dbGuild.priceDropRate;

            await this.db.inventory.updateGuildItemPrice(guild.id, item, 1.0 - salePercentage);
          }
        })
        .then(() => this.db.inventory.resetStoreCycle(guild.id))
        .then(() => new StoreStatusController(this.db, guild).update());
    });

    return Promise.all(guildStoreUpdates);
  }
}

export default ScheduleWatcher;
