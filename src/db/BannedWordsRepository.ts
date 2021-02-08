import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import Repository from "./Repository";
import { escape } from "mysql2";

export default class BannedWordsRepository extends Repository {
  public getAll(guildId: string) {
    return this.pool
      .query("SELECT * FROM banned_words WHERE guild_id = ?", [guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word as string);
      });
  }

  public insert(wordList: string[][]) {
    return this.pool
      .query("INSERT IGNORE INTO banned_words (word, guild_id) VALUES ?", [wordList])
      .then(([results, fields]: [ResultSetHeader, FieldPacket[]]) => {
        return results.insertId;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  public delete(guildId: string, words: string[]) {
    return this.pool
      .query("DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?", [words, guildId])
      .catch((e) => {
        console.error(e);
      });
  }

  public contains(guildId: string, words: string[]) {
    return this.pool
      .query(`SELECT * FROM banned_words WHERE guild_id = ? AND word IN (${escape(words)})`, [
        guildId,
      ])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word as string);
      });
  }
}
