import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import DbGuild from "../structures/DbGuild";
import Repository from "./Repository";
import ScreeningQuestion from "../structures/ScreeningQuestion";

export default class GuildsRepository extends Repository {
  public get(guildId: String) {
    return this.pool
      .query("SELECT * FROM guilds WHERE id = ?", [guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }
        return this.toGuildObject(rows[0]);
      });
  }

  public setMessageRate(guildId: String, messagePayout: Number) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, message_rate) VALUES (?,?) ON DUPLICATE KEY UPDATE message_rate = VALUES(message_rate)",
        [guildId, messagePayout]
      )
      .catch((error) => console.error(error));
  }

  public setCensorship(guildId: String, enabled: Boolean) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, censorship_enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE censorship_enabled = VALUES(censorship_enabled)",
        [guildId, enabled]
      )
      .catch((error) => console.error(error));
  }

  public updateCensorshipRegex(guildId: String, regex: String) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, censor_regex) VALUES (?,?) ON DUPLICATE KEY UPDATE censor_regex = VALUES(censor_regex)",
        [guildId, regex]
      )
      .catch((error) => console.error(error));
  }

  public setRoleMessage(guildId: String, messageId: String) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, role_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE role_message_id = VALUES(role_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  public setStoreMessage(guildId: String, messageId: String) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, store_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE store_message_id = VALUES(store_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  public setBanListMessage(guildId: String, messageId: String) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, ban_list_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE ban_list_message_id = VALUES(ban_list_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  public getScreeningQuestions(guildId: String) {
    return this.pool
      .query("SELECT * FROM screening_questions WHERE guild_id=?", [guildId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map(
          (r) => new ScreeningQuestion(r.id, r.prompt, r.answer, r.timeout_ms, r.strict)
        );
      });
  }

  public insertScreeningQuestion(guildId: String, question: ScreeningQuestion) {
    return this.pool.query(
      "INSERT INTO screening_questions (guild_id, prompt, answer, timeout_ms, strict) VALUES(?,?,?,?,?)",
      [guildId, question.prompt, question.answer, question.timeout, question.strict]
    );
  }

  public deleteScreeningQuestion(guildId: String, questionId: number) {
    return this.pool
      .query("DELETE FROM screening_questions WHERE guild_id=? AND id=?", [guildId, questionId])
      .then(([header, fields]: [ResultSetHeader, FieldPacket[]]) => {
        return header.affectedRows > 0;
      });
  }

  private toGuildObject(dbRow: any) {
    return new DbGuild(
      dbRow.id,
      dbRow.censorship_enabled,
      dbRow.tax_rate,
      dbRow.role_message_id,
      dbRow.store_message_id,
      dbRow.ban_list_message_id,
      dbRow.message_rate,
      dbRow.message_reset_s,
      dbRow.reactor_rate,
      dbRow.reactee_rate,
      dbRow.price_hike_coefficient,
      dbRow.price_drop_days,
      dbRow.price_drop_rate
    );
  }
}
