import { FieldPacket, Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { escape } from "mysql2";

export default class BannedWordsTable {
  private _pool: Pool;

  public constructor(pool: Pool) {
    this._pool = pool;
  }

  public getAll(guildId: string) {
    return this._pool
      .query("SELECT * FROM banned_words WHERE guild_id = ?", [guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word as string);
      });
  }

  public insert(wordList: string[][]) {
    return this._pool
      .query("INSERT IGNORE INTO banned_words (word, guild_id) VALUES ?", [wordList])
      .then(([results, fields]: [ResultSetHeader, FieldPacket[]]) => {
        return results.insertId;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  public delete(guildId: string, words: string[]) {
    return this._pool
      .query("DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?", [words, guildId])
      .catch((e) => {
        console.error(e);
      });
  }

  public contains(guildId: string, words: string[]) {
    return this._pool
      .query(`SELECT * FROM banned_words WHERE guild_id = ? AND word IN (${escape(words)})`, [
        guildId,
      ])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word as string);
      });
  }
}
