import { Pool } from "mysql2/promise";
import { createPool } from "mysql2";
import secretConfig from "../../config/secrets.config";
import { singleton } from "tsyringe";

@singleton()
class DatabaseService {
  private _pool: Pool;

  public constructor() {
    const pool = createPool({
      host: secretConfig().database.host,
      port: secretConfig().database.port,
      user: secretConfig().database.user,
      password: secretConfig().database.password,
      database: secretConfig().database.database,
      connectionLimit: 5,
    }).promise();

    this._pool = pool;
  }

  public getPool(): Pool {
    return this._pool;
  }
}

export default DatabaseService;
