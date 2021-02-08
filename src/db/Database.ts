import BannedWordsRepository from "./BannedWordsRepository";
import ChannelsRepository from "./ChannelsRepository";
import GuildsRepository from "./GuildsRepository";
import InventoryRepository from "./InventoryRepository";
import { Pool } from "mysql2/promise";
import RolesRepository from "./RolesRepository";
import UsersRepository from "./UsersRepository";
import { createPool } from "mysql2";
import secretConfig from "../../config/secrets.config";

export default class Database {
  public users: UsersRepository;
  public bannedWords: BannedWordsRepository;
  public guilds: GuildsRepository;
  public channels: ChannelsRepository;
  public roles: RolesRepository;
  public inventory: InventoryRepository;

  public constructor(pool: Pool) {
    this.users = new UsersRepository(pool);
    this.bannedWords = new BannedWordsRepository(pool);
    this.guilds = new GuildsRepository(pool);
    this.channels = new ChannelsRepository(pool);
    this.roles = new RolesRepository(pool);
    this.inventory = new InventoryRepository(pool);
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
