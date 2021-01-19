import Database from "../db/Database.js";

export default class Controller {
  public db: Database;

  public constructor(db: Database) {
    this.db = db;
  }
}
