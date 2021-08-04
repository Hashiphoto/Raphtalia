import { CronJob } from "cron";
import { Client } from "discord.js";
import { Pool } from "mysql2/promise";
import { inject, singleton } from "tsyringe";
import { dropStorePrices } from "../jobs/dropPrices.job";
import { resolveRoleContests } from "../jobs/resolveContests.job";
import ClientService from "./Client.service";
import DatabaseService from "./Database.service";

/**
  CRON Quick Refernce
  * * * * * *
  │ │ │ │ │ └ Day of week (0 - 7) (Sunday=0 or 7)
  │ │ │ │ └── Month (1 - 12)
  │ │ │ └──── Day of month (1 - 31)
  │ │ └────── Hour (0 - 23)
  │ └──────── Minute (0 - 59)
  └────────── Second (0 - 59) (optional)
  
    @yearly, @monthly, @weekly, @daily, @hourly,
  */
@singleton()
export default class JobService {
  private timezone: string;
  private pool: Pool;
  private client: Client;

  public constructor(
    @inject(DatabaseService) private dbService: DatabaseService,
    @inject(ClientService) private clientService: ClientService
  ) {
    this.pool = this.dbService.getPool();
    this.client = this.clientService.getClient();
    this.timezone = "America/Los_Angeles";
  }

  public start(): void {
    // Every day at 08:00 PM
    new CronJob("0 20 * * *", () => resolveRoleContests(this.client), null, true, this.timezone);

    // Every day at 06:30 AM
    new CronJob("30 6 * * *", () => dropStorePrices(this.client), null, true, this.timezone);
  }
}
