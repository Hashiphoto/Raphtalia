import "reflect-metadata";

import ClientService from "./services/Client.service";
import DatabaseService from "./services/Database.service";
import JobService from "./services/Job.service";
import { container } from "tsyringe";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import secretConfig from "../config/secrets.config";

dayjs.extend(duration);

const init = async () => {
  /**
   * Start and test db connection
   */
  const database = container.resolve(DatabaseService);
  try {
    const pool = database.getPool();
    await pool.query("SELECT 1+1").then(() => {
      console.log("Connected to db");
    });
  } catch (e) {
    if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
      const command = `ssh -f ${secretConfig().database.user}@${secretConfig().ssh} -L ${
        secretConfig().database.port
      }:localhost:3306 -N`;
      console.error(
        `Can't connect to the database. Make sure that you are forwarding traffic to the ` +
          `server with the following powershell command:\n${command}`
      );
    } else {
      console.error(
        `ENV=${process.env.NODE_ENV}\nCan't establish connection to the database\n` + e
      );
    }

    console.error("Startup aborted");
    return;
  }

  /**
   * Start CRON jobs
   */
  const jobService = container.resolve(JobService);
  jobService.start();

  /**
   * Start Discord client
   */
  const clientService = container.resolve(ClientService);
  clientService.login();
  clientService.configureRoutes();
};

init();
