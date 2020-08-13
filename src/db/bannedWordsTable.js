import mysqlPromise from "mysql2/promise.js";

class BannedWordsTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  getAll(guildId) {
    return this.pool
      .query("SELECT * FROM banned_words WHERE guild_id = ?", [guildId])
      .then(([rows, fields]) => {
        return rows;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  insert(wordList) {
    return this.pool
      .query("INSERT IGNORE INTO banned_words (word, guild_id) VALUES ?", [
        wordList,
      ])
      .then(([results, fields]) => {
        return results.insertId;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  delete(guildId, word) {
    return this.pool
      .query("DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?", [
        word,
        guildId,
      ])
      .catch((e) => {
        console.error(e);
      });
  }
}

export default BannedWordsTable;
