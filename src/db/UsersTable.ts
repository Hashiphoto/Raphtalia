import { FieldPacket, Pool, RowDataPacket } from "mysql2/promise";

import DbUser from "../structures/DbUser.js";
import Util from "../Util.js";

export default class UsersTable {
  private _pool: Pool;

  public constructor(pool: Pool) {
    this._pool = pool;
  }

  public get(id: string, guildId: string) {
    return this._pool
      .query("SELECT * FROM users WHERE id = ? AND guild_id = ?", [id, guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return new DbUser(id, guildId, 0, 0, false, 0, new Date());
        }
        return this.toUserObject(rows[0]);
      });
  }

  public incrementInfractions(id: string, guildId: string, count: number) {
    return this._pool.query(
      "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE infractions = infractions + VALUES(infractions)",
      [id, guildId, count]
    );
  }

  public setInfractions(id: string, guildId: string, count: number) {
    return this._pool.query(
      "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE infractions = VALUES(infractions)",
      [id, guildId, count]
    );
  }

  public incrementCurrency(id: string, guildId: string, amount: number) {
    return this._pool.query(
      "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE currency = currency + VALUES(currency)",
      [id, guildId, Util.round(amount)]
    );
  }

  public setCurrency(id: string, guildId: string, amount: number) {
    return this._pool.query(
      "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE currency = VALUES(currency)",
      [id, guildId, Util.round(amount)]
    );
  }

  public setCitizenship(id: string, guildId: string, isCitizen: boolean) {
    return this._pool.query(
      "INSERT INTO users (id, guild_id, citizenship) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE citizenship = VALUES(citizenship)",
      [id, guildId, isCitizen]
    );
  }

  public setLastMessageDate(id: string, guildId: string, date: Date) {
    return this._pool.query(
      "INSERT INTO users (id, guild_id, last_message_date) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE last_message_date = VALUES(last_message_date)",
      [id, guildId, date]
    );
  }

  private toUserObject(dbRow: RowDataPacket) {
    return new DbUser(
      dbRow.id,
      dbRow.guild_id,
      dbRow.infractions,
      parseFloat(dbRow.currency),
      dbRow.citizenship,
      dbRow.bonus_income,
      dbRow.last_message_date
    );
  }
}
