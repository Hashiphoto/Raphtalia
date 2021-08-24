import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import Repository from "./Repository";
import { autoInjectable } from "tsyringe";
import { escape } from "mysql2";

@autoInjectable()
export default class BannedWordsRepository extends Repository {
  public async getAll(guildId: string): Promise<string[]> {
    return this.pool
      .query("SELECT * FROM banned_words WHERE guild_id = ?", [guildId])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word as string);
      });
  }

  public async insert(wordList: string[][]): Promise<void> {
    await this.pool
      .query("INSERT IGNORE INTO banned_words (word, guild_id) VALUES ?", [wordList])
      .then(([results]: [ResultSetHeader, FieldPacket[]]) => {
        return results.insertId;
      });
  }

  public async delete(guildId: string, words: string[]): Promise<void> {
    await this.pool.query("DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?", [
      words,
      guildId,
    ]);
  }

  public async contains(guildId: string, words: string[]): Promise<string[]> {
    return this.pool
      .query(`SELECT * FROM banned_words WHERE guild_id = ? AND word IN (${escape(words)})`, [
        guildId,
      ])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => r.word as string);
      });
  }
}
