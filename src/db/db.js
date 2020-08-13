import mysql from "mysql2";

import secretConfig from "../../config/secrets.config.js";
import UsersTable from "./usersTable.js";
import BannedWordsTable from "./bannedWordsTable.js";
import GuildsTable from "./guildsTable.js";
import ChannelsTable from "./channelsTable.js";
import RolesTable from "./rolesTable.js";

var pool;

function init(pool = null) {
  if (pool) {
    return;
  }
  pool = mysql
    .createPool({
      //Create database connections
      host: secretConfig().database.host,
      port: secretConfig().database.port,
      user: secretConfig().database.user,
      password: secretConfig().database.password,
      database: secretConfig().database.database,
      connectionLimit: 5,
    })
    .promise();

  pool
    .query("SELECT 1+1")
    .then(() => {
      console.log("Connected to db");
    })
    .catch((e) => {
      if (process.env.NODE_ENV === "dev") {
        let command = `ssh -f ${secretConfig().database.user}@${
          secretConfig().ssh
        } -L ${secretConfig().database.port}:localhost:3306 -N`;
        console.error(
          "Can't connect to the database. Make sure that you are forwarding traffic to the server with the powershell command\n" +
            command
        );
      } else {
        console.error("Can't establish connection to the database\n" + e);
      }
    });
}

const users = new UsersTable(pool);
const bannedWords = new BannedWordsTable(pool);
const guilds = new GuildsTable(pool);
const channels = new ChannelsTable(pool);
const roles = new RolesTable(pool);

export default {
  init,
  users,
  bannedWords,
  guilds,
  channels,
  roles,
};
