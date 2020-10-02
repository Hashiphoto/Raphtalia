import mysqlPromise from "mysql2/promise.js";
import DbGuild from "../structures/DbGuild.js";

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
      dbRow.censor_regex,
      dbRow.tax_rate,
      dbRow.role_message_id,
      dbRow.store_message_id,
      dbRow.message_rate,
      dbRow.message_reset_s,
      dbRow.reactor_rate,
      dbRow.reactee_rate
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

  setRoleMessage(guildId, messageId) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, role_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE role_message_id = VALUES(role_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }

  setStoreMessage(guildId, messageId) {
    return this.pool
      .query(
        "INSERT INTO guilds (id, store_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE store_message_id = VALUES(store_message_id)",
        [guildId, messageId]
      )
      .catch((error) => console.error(error));
  }
}

export default GuildsTable;
