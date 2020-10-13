import mysqlPromise from "mysql2/promise.js";
import DbGuild from "../structures/DbGuild.js";
import ScreeningQuestion from "../structures/ScreeningQuestion.js";
import Question from "../structures/ScreeningQuestion.js";

class GuildsTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * @param {any} dbRow
   * @returns {DbGuild}
   */
  toGuildObject(dbRow) {
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

  /**
   * @param {String} guildId
   * @returns {Promise<DbGuild>}
   */
  get(guildId) {
    return this.pool
      .query("SELECT * FROM guilds WHERE id = ?", [guildId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }
        return this.toGuildObject(rows[0]);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  /**
   * @param {String} guildId
   * @param {Number} messagePayout
   * @returns {Promise<any>}
   */
  setMessageRate(guildId, messagePayout) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, message_rate) VALUES (?,?) ON DUPLICATE KEY UPDATE message_rate = VALUES(message_rate)",
        [guildId, messagePayout]
      )
      .catch((error) => console.error(error));
  }

  setCensorship(guildId, enabled) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, censorship_enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE censorship_enabled = VALUES(censorship_enabled)",
        [guildId, enabled]
      )
      .catch((error) => console.error(error));
  }

  updateCensorshipRegex(guildId, regex) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, censor_regex) VALUES (?,?) ON DUPLICATE KEY UPDATE censor_regex = VALUES(censor_regex)",
        [guildId, regex]
      )
      .catch((error) => console.error(error));
  }

  /**
   * @param {String} guildId
   * @param {String} messageId
   * @returns {Promise<void>}
   */
  setRoleMessage(guildId, messageId) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, role_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE role_message_id = VALUES(role_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  /**
   * @param {String} guildId
   * @param {String} messageId
   * @returns {Promise<void>}
   */
  setStoreMessage(guildId, messageId) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, store_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE store_message_id = VALUES(store_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  setBanListMessage(guildId, messageId) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, ban_list_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE ban_list_message_id = VALUES(ban_list_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  /**
   * @param {String} guildId
   * @returns {Promise<ScreeningQuestion[]>}
   */
  getScreeningQuestions(guildId) {
    return this.pool
      .query("SELECT * FROM screening_questions WHERE guild_id=?", [guildId])
      .then(([rows, fields]) => {
        return rows.map(
          (r) => new ScreeningQuestion(r.id, r.prompt, r.answer, r.timeout_ms, r.strict)
        );
      });
  }

  /**
   * @param {String} guildId
   * @param {ScreeningQuestion} question
   */
  insertScreeningQuestion(guildId, question) {
    return this.pool.query(
      "INSERT INTO screening_questions (guild_id, prompt, answer, timeout_ms, strict) VALUES(?,?,?,?,?)",
      [guildId, question.prompt, question.answer, question.timeout, question.strict]
    );
  }

  /**
   * @param {String} guildId
   * @param {Number} questionId
   * @returns {Promise<Boolean>} True if at least one row was deleted
   */
  deleteScreeningQuestion(guildId, questionId) {
    return this.pool
      .query("DELETE FROM screening_questions WHERE guild_id=? AND id=?", [guildId, questionId])
      .then(([header, fields]) => {
        return header.affectedRows > 0;
      });
  }
}

export default GuildsTable;
