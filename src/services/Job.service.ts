import { container, singleton } from "tsyringe";

import { Client } from "discord.js";
import ClientService from "./Client.service";
import { CronJob } from "cron";
import DatabaseService from "./Database.service";
import DropPricesJob from "../jobs/DropPrices.job";
import { Pool } from "mysql2/promise";
import ResolveContestsJob from "../jobs/ResolveContests.job";

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

  public constructor(private dbService: DatabaseService, private clientService: ClientService) {
    this.pool = this.dbService.getPool();
    this.client = this.clientService.getClient();
    this.timezone = "America/Los_Angeles";
  }

  public start(): void {
    // Every day at 08:00 PM
    new CronJob(
      "0 20 * * *",
      () => container.resolve(ResolveContestsJob).run(this.client),
      null,
      true,
      this.timezone
    );

    // Every day at 06:30 AM
    new CronJob(
      "30 6 * * *",
      () => container.resolve(DropPricesJob).run(this.client),
      null,
      true,
      this.timezone
    );
  }
}
