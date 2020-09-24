import mysql from "mysql2";

import secretConfig from "../../config/secrets.config.js";
import UsersTable from "./UsersTable.js";
import BannedWordsTable from "./BannedWordsTable.js";
import GuildsTable from "./GuildsTable.js";
import ChannelsTable from "./ChannelsTable.js";
import RolesTable from "./RolesTable.js";
import Inventory from "./Inventory.js";

class Database {
  constructor(pool) {
    this.users = new UsersTable(pool);
    this.bannedWords = new BannedWordsTable(pool);
    this.guilds = new GuildsTable(pool);
    this.channels = new ChannelsTable(pool);
    this.roles = new RolesTable(pool);
    this.inventory = new Inventory(pool);
  }

  static createPool() {
    const pool = mysql
      .createPool({
        host: secretConfig().database.host,
        port: secretConfig().database.port,
        user: secretConfig().database.user,
        password: secretConfig().database.password,
        database: secretConfig().database.database,
        connectionLimit: 5,
      })
      .promise();

    // Test connection
    pool
      .query("SELECT 1+1")
      .then(() => {
        console.log("Connected to db");
      })
      .catch((e) => {
        if (process.env.NODE_ENV === "dev") {
          let command = `ssh -f ${secretConfig().database.user}@${secretConfig().ssh} -L ${
            secretConfig().database.port
          }:localhost:3306 -N`;
          console.error(
            "Can't connect to the database. Make sure that you are forwarding traffic to the server with the powershell command\n" +
              command
          );
        } else {
          console.error("Can't establish connection to the database\n" + e);
        }
      });

    return pool;
  }
}

export default Database;
