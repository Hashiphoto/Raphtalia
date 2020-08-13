import mysqlPromise from "mysql2/promise.js";

class UsersTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  get(id, guildId) {
    return this.pool
      .query("SELECT * FROM users WHERE id = ? AND guild_id = ?", [id, guildId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return {
            id: id,
            guild_id: guildId,
            infractions: 0,
            citizenship: false,
            currency: 0,
          };
        }
        return rows[0];
      })
      .catch((error) => console.error(error));
  }

  getGuildUsers(guildId) {
    return this.pool
      .query("SELECT * FROM users WHERE guild_id = ?", [guildId])
      .catch((error) => console.error(error));
  }

  incrementInfractions(id, guildId, count) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) ON DUPLICATE KEY UPDATE infractions = infractions + VALUES(infractions)",
        [id, guildId, count]
      )
      .catch((error) => console.error(error));
  }

  setInfractions(id, guildId, count) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) ON DUPLICATE KEY UPDATE infractions = VALUES(infractions)",
        [id, guildId, count]
      )
      .catch((error) => console.error(error));
  }

  incrementCurrency(id, guildId, amount) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) ON DUPLICATE KEY UPDATE currency = currency + VALUES(currency)",
        [id, guildId, amount]
      )
      .catch((error) => console.error(error));
  }

  setCurrency(id, guildId, amount) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) ON DUPLICATE KEY UPDATE currency = VALUES(currency)",
        [id, guildId, amount]
      )
      .catch((error) => console.error(error));
  }

  setCitizenship(id, guildId, isCitizen) {
    return this.pool
      .query(
        "INSERT INTO users (id, guild_id, citizenship) VALUES (?,?,?) ON DUPLICATE KEY UPDATE citizenship = VALUES(citizenship)",
        [id, guildId, isCitizen]
      )
      .catch((error) => console.error(error));
  }
}

export default UsersTable;
