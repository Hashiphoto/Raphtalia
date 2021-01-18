import Database from "../db/Database.js";

class Controller {
  /**
   * @param {Database} db
   */
  constructor(db) {
    this.db = db;
  }
}

export default Controller;
