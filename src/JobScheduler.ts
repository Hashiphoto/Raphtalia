import { Client } from "discord.js";
import { CronJob } from "cron";
import Database from "./db/Database";
import ExecutionContext from "./structures/ExecutionContext";
import RoleContestController from "./controllers/RoleContestController";
import StoreStatusController from "./controllers/message/StoreStatusController";
import dayjs from "dayjs";

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
export default class JobScheduler {
  private db: Database;
  private client: Client;
  private timezone: string;

  public constructor(db: Database, client: Client) {
    this.db = db;
    this.client = client;
    this.timezone = "America/Los_Angeles";
  }

  public start() {
    // Every day at 08:00 PM
    new CronJob("0 20 * * *", () => this.resolveRoleContests(), null, true, this.timezone);

    // Every day at 06:30 AM
    new CronJob("30 6 * * *", () => this.dropStorePrices(), null, true, this.timezone);
  }

  private async resolveRoleContests() {
    const guildContests = this.client.guilds.cache.map(async (guild) => {
      const context = new ExecutionContext(this.db, this.client, guild);
      const feedback = await new RoleContestController(context)
        .resolveRoleContests(true)
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
  }

  private async dropStorePrices() {
    const guildStoreUpdates = this.client.guilds.cache.map(async (guild) => {
      const dbGuild = await this.db.guilds.get(guild.id);

      if (!dbGuild) {
        return;
      }

      return this.db.inventory
        .getGuildStock(guild.id)
        .then(async (guildItems) => {
          for (const item of guildItems) {
            // Don't let sold-out items depreciate for no reason
            // Also, don't change the price of explictly set free items
            if (item.soldInCycle !== 0 || item.quantity === 0 || item.price === 0) {
              continue;
            }
            const hoursSinceLastSold = dayjs
              .duration(dayjs().diff(dayjs(item.dateLastSold)))
              .asHours();
            const daysSinceLastSold = Math.floor(hoursSinceLastSold / 24);
            const salePercentage =
              Math.ceil(daysSinceLastSold / dbGuild.priceDropDays) * dbGuild.priceDropRate;

            let newPrice = item.price * (1.0 - salePercentage);
            if (newPrice <= 0.01) {
              newPrice = 0.01;
            }
            await this.db.inventory.updateGuildItemPrice(guild.id, item, newPrice);
          }
        })
        .then(() => this.db.inventory.resetStoreCycle(guild.id))
        .then(() => {
          const context = new ExecutionContext(this.db, this.client, guild);
          new StoreStatusController(context).update();
        });
    });

    return Promise.all(guildStoreUpdates);
  }
}
