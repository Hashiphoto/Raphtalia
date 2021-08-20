import DatabaseService from "../services/Database.service";
import { Pool } from "mysql2/promise";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Repository {
  protected pool: Pool;

  public constructor(protected databaseService?: DatabaseService) {
    this.pool = this.databaseService?.getPool() as Pool;
  }
}
