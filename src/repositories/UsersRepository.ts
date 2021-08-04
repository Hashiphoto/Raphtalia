import { FieldPacket, RowDataPacket } from "mysql2/promise";

import Repository from "./Repository";
import User from "../models/User";
import Util from "../Util";

export default class UsersRepository extends Repository {
  public get(id: string, guildId: string) {
    return this.pool
      .query("SELECT * FROM users WHERE id = ? AND guild_id = ?", [id, guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return new User(id, guildId, 0, 0, false, 0, new Date());
        }
        return this.toUserObject(rows[0]);
      });
  }

  public incrementInfractions(id: string, guildId: string, count: number) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE infractions = infractions + VALUES(infractions)",
      [id, guildId, count]
    );
  }

  public setInfractions(id: string, guildId: string, count: number) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE infractions = VALUES(infractions)",
      [id, guildId, count]
    );
  }

  public incrementCurrency(id: string, guildId: string, amount: number) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE currency = currency + VALUES(currency)",
      [id, guildId, Util.round(amount)]
    );
  }

  public setCurrency(id: string, guildId: string, amount: number) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE currency = VALUES(currency)",
      [id, guildId, Util.round(amount)]
    );
  }

  public setCitizenship(id: string, guildId: string, isCitizen: boolean) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, citizenship) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE citizenship = VALUES(citizenship)",
      [id, guildId, isCitizen]
    );
  }

  public setLastMessageDate(id: string, guildId: string, date: Date) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, last_message_date) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE last_message_date = VALUES(last_message_date)",
      [id, guildId, date]
    );
  }

  private toUserObject(dbRow: RowDataPacket) {
    return new User(
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
