import { Pool } from "mysql2/promise";
import { inject, injectable } from "tsyringe";
import DatabaseService from "../services/Database.service";

@injectable()
export default class BaseRepository {
  protected pool: Pool;
  public constructor(@inject(DatabaseService) private databaseService: DatabaseService) {
    this.pool = this.databaseService.getPool();
  }
}
