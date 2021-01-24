import BannedWordsTable from "./BannedWordsTable.js";
import ChannelsTable from "./ChannelsTable.js";
import GuildsTable from "./GuildsTable.js";
import InventoryTable from "./InventoryTable.js";
import { Pool } from "mysql2/promise";
import RolesTable from "./RolesTable.js";
import UsersTable from "./UsersTable.js";
import { createPool } from "mysql2";
import secretConfig from "../../config/secrets.config.js";

export default class Database {
  public users: UsersTable;
  public bannedWords: BannedWordsTable;
  public guilds: GuildsTable;
  public channels: ChannelsTable;
  public roles: RolesTable;
  public inventory: InventoryTable;

  public constructor(pool: Pool) {
    this.users = new UsersTable(pool);
    this.bannedWords = new BannedWordsTable(pool);
    this.guilds = new GuildsTable(pool);
    this.channels = new ChannelsTable(pool);
    this.roles = new RolesTable(pool);
    this.inventory = new InventoryTable(pool);
  }

  public static async createPool() {
    const pool = createPool({
      host: secretConfig().database.host,
      port: secretConfig().database.port,
      user: secretConfig().database.user,
      password: secretConfig().database.password,
      database: secretConfig().database.database,
      connectionLimit: 5,
    }).promise();

    return pool;
  }
}
