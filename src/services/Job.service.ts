import { CronJob } from "cron";
import { container, delay, inject, singleton } from "tsyringe";
import DecayItemsJob from "../jobs/DecayItemsJob";
import DropPricesJob from "../jobs/DropPrices.job";
import ResolveContestsJob from "../jobs/ResolveContests.job";
import ClientService from "./Client.service";

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

  public constructor(@inject(delay(() => ClientService)) private _clientService: ClientService) {
    this.timezone = "America/Los_Angeles";
  }

  public start(): void {
    const client = this._clientService.getClient();

    // Every day at 08:00 PM
    new CronJob(
      "0 20 * * *",
      () => container.resolve(ResolveContestsJob).run(client),
      null,
      true,
      this.timezone
    );

    // Every day at 06:30 AM
    new CronJob(
      "30 6 * * *",
      () => container.resolve(DropPricesJob).run(client),
      null,
      true,
      this.timezone
    );

    // Every day at 8:00 AM
    new CronJob(
      "0 8 * * *",
      () => container.resolve(DecayItemsJob).run(client),
      null,
      true,
      this.timezone
    );
  }
}
