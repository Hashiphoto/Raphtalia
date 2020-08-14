import mysqlPromise from "mysql2/promise.js";
import { getPool } from "./db.js";

const bannedWordsTable = (function () {
  return {
    getAll(guildId) {
      return getPool()
        .query("SELECT * FROM banned_words WHERE guild_id = ?", [guildId])
        .then(([rows, fields]) => {
          return rows;
        })
        .catch((e) => {
          console.error(e);
        });
    },

    insert(wordList) {
      return getPool()
        .query("INSERT IGNORE INTO banned_words (word, guild_id) VALUES ?", [
          wordList,
        ])
        .then(([results, fields]) => {
          return results.insertId;
        })
        .catch((e) => {
          console.error(e);
        });
    },

    delete(guildId, word) {
      return getPool()
        .query(
          "DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?",
          [word, guildId]
        )
        .catch((e) => {
          console.error(e);
        });
    },
  };
})();

export default bannedWordsTable;
