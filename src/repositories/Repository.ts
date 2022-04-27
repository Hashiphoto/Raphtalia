import DatabaseService from "../services/Database.service";
import { Pool } from "mysql2/promise";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Repository {
  protected pool: Pool;

  public constructor(protected databaseService?: DatabaseService) {
    const pool = this.databaseService?.getPool() as Pool;
    if (!pool) {
      throw new RaphError(Result.ProgrammingError, `pool is undefined`);
    } else {
      this.pool = pool;
    }
  }
}
