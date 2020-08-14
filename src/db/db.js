import mysql from "mysql2";

import secretConfig from "../../config/secrets.config.js";
import usersTable from "./usersTable.js";
import bannedWordsTable from "./bannedWordsTable.js";
import guildsTable from "./guildsTable.js";
import channelsTable from "./channelsTable.js";
import rolesTable from "./rolesTable.js";

var pool;

function init() {
  // Instantiate pool connection
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

  // Test connection
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

export function getPool() {
  return pool;
}

export default {
  init,
  users: usersTable,
  bannedWords: bannedWordsTable,
  guilds: guildsTable,
  channels: channelsTable,
  roles: rolesTable,
};
