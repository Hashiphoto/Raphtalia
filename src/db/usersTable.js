import mysqlPromise from "mysql2/promise.js";
import DbUser from "../structures/DbUser.js";

class UsersTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  roundCurrency(amount) {
    amount *= 100;
    amount = Math.round(amount);
    amount /= 100;
    return amount;
  }

  toUserObject(dbRow) {
    return new DbUser(
      dbRow.id,
      dbRow.guild_id,
      dbRow.infractions,
      dbRow.currency,
      dbRow.citizenship,
      dbRow.bonus_income,
      dbRow.last_message_date
    );
  }

  /**
   * @param {String} id
   * @param {String} guildId
   * @returns {Promise<DbUser>}
   */
  get(id, guildId) {
    return this.pool
      .query("SELECT * FROM users WHERE id = ? AND guild_id = ?", [id, guildId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return new DbUser(id, guildId, 0, 0, false, 0, null);
        }
        return this.toUserObject(rows[0]);
      })
      .catch((error) => console.error(error));
  }

  incrementInfractions(id, guildId, count) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) " +
          "ON DUPLICATE KEY UPDATE infractions = infractions + VALUES(infractions)",
        [id, guildId, count]
      )
      .catch((error) => console.error(error));
  }

  setInfractions(id, guildId, count) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) " +
          "ON DUPLICATE KEY UPDATE infractions = VALUES(infractions)",
        [id, guildId, count]
      )
      .catch((error) => console.error(error));
  }

  incrementCurrency(id, guildId, amount) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) " +
          "ON DUPLICATE KEY UPDATE currency = currency + VALUES(currency)",
        [id, guildId, this.roundCurrency(amount)]
      )
      .catch((error) => console.error(error));
  }

  setCurrency(id, guildId, amount) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) " +
          "ON DUPLICATE KEY UPDATE currency = VALUES(currency)",
        [id, guildId, this.roundCurrency(amount)]
      )
      .catch((error) => console.error(error));
  }

  setCitizenship(id, guildId, isCitizen) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, citizenship) VALUES (?,?,?) " +
          "ON DUPLICATE KEY UPDATE citizenship = VALUES(citizenship)",
        [id, guildId, isCitizen]
      )
      .catch((error) => console.error(error));
  }

  /**
   * @param {String} id
   * @param {String} guildId
   * @param {Date} date
   * @returns {Promise<void>}
   */
  setLastMessageDate(id, guildId, date) {
    return this.pool.query(
      "INSERT INTO users (id, guild_id, last_message_date) VALUES (?,?,?) " +
        "ON DUPLICATE KEY UPDATE last_message_date = VALUES(last_message_date)",
      [id, guildId, date]
    );
  }
}

export default UsersTable;
