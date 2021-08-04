import DatabaseService from "../services/Database.service";
import { Pool } from "mysql2/promise";
import { autoInjectable } from "tsyringe";

@autoInjectable()
class Repository {
  protected pool: Pool;

  public constructor(private db?: DatabaseService) {
    if (db) {
      this.pool = db?.getPool();
    }
  }
}

export default Repository;
