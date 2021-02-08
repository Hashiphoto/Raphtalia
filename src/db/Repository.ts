import { Pool } from "mysql2/promise";

export default class Repository {
  protected pool: Pool;

  public constructor(pool: Pool) {
    this.pool = pool;
  }
}
