import Raphtalia from "./Raphtalia.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import Database from "./db/Database.js";
import secretConfig from "../config/secrets.config.js";

dayjs.extend(duration);

(async function init() {
  Database.createPool()
    .then((pool) => {
      // Test connection
      return pool.query("SELECT 1+1").then(() => {
        console.log("Connected to db");
        return pool;
      });
    })
    .then((pool) => {
      // Start app
      const raphtalia = new Raphtalia(new Database(pool));
      raphtalia.configureDiscordClient();
    })
    .catch((e) => {
      if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
        let command = `ssh -f ${secretConfig().database.user}@${secretConfig().ssh} -L ${
          secretConfig().database.port
        }:localhost:3306 -N`;
        console.error(
          `Can't connect to the database. Make sure that you are forwarding traffic to the ` +
            `server with the following powershell command:\n${command}`
        );
      } else {
        console.error("Can't establish connection to the database\n" + e);
      }
    });
})();
