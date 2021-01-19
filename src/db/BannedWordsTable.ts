class BannedWordsTable {
  constructor(pool) {
    this.pool = pool;
  }

  getAll(guildId) {
    return this.pool
      .query("SELECT * FROM banned_words WHERE guild_id = ?", [guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  insert(wordList) {
    return this.pool
      .query("INSERT IGNORE INTO banned_words (word, guild_id) VALUES ?", [wordList])
      .then(([results, fields]) => {
        return results.insertId;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  delete(guildId, word) {
    return this.pool
      .query("DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?", [word, guildId])
      .catch((e) => {
        console.error(e);
      });
  }

  /**
   * @param {String} guildId
   * @param {String[]} words
   */
  contains(guildId, words) {
    return this.pool
      .query(`SELECT * FROM banned_words WHERE guild_id = ? AND word IN (${mysql.escape(words)})`, [
        guildId,
      ])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word);
      });
  }
}

export default BannedWordsTable;
