import mysqlPromise from "mysql2/promise.js";
import { getPool } from "./db.js";

const guildsTable = (function () {
  return {
    get(guildId) {
      return getPool()
        .query("SELECT * FROM guilds WHERE id = ?", [guildId])
        .then(([rows, fields]) => {
          if (rows.length === 0) {
            return null;
          }
          return rows[0];
        })
        .catch((e) => {
          console.error(e);
        });
    },

    setCensorship(guildId, enabled) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, censorship_enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE censorship_enabled = VALUES(censorship_enabled)",
          [guildId, enabled]
        )
        .catch((error) => console.error(error));
    },

    updateCensorshipRegex(guildId, regex) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, censor_regex) VALUES (?,?) ON DUPLICATE KEY UPDATE censor_regex = VALUES(censor_regex)",
          [guildId, regex]
        )
        .catch((error) => console.error(error));
    },

    setCharacterValue(guildId, characterValue) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, character_value) VALUES (?,?) ON DUPLICATE KEY UPDATE character_value = VALUES(character_value)",
          [guildId, characterValue]
        )
        .catch((error) => console.error(error));
    },

    setMaxPayout(guildId, maxPayout) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, max_payout) VALUES (?,?) ON DUPLICATE KEY UPDATE max_payout = VALUES(max_payout)",
          [guildId, maxPayout]
        )
        .catch((error) => console.error(error));
    },

    setBasePayout(guildId, basePayout) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, base_payout) VALUES (?,?) ON DUPLICATE KEY UPDATE base_payout = VALUES(base_payout)",
          [guildId, basePayout]
        )
        .catch((error) => console.error(error));
    },

    setMinLength(guildId, minLength) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, min_length) VALUES (?,?) ON DUPLICATE KEY UPDATE min_length = VALUES(min_length)",
          [guildId, minLength]
        )
        .catch((error) => console.error(error));
    },

    setTaxRate(guildId, taxRate) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, tax_rate) VALUES (?,?) ON DUPLICATE KEY UPDATE tax_rate = VALUES(tax_rate)",
          [guildId, taxRate]
        )
        .catch((error) => console.error(error));
    },

    setBaseIncome(guildId, baseIncome) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, base_income) VALUES (?,?) ON DUPLICATE KEY UPDATE base_income = VALUES(base_income)",
          [guildId, baseIncome]
        )
        .catch((error) => console.error(error));
    },

    setStatusMessage(guildId, messageId) {
      return getPool()
        .query(
          "INSERT INTO guilds (id, status_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE status_message_id = VALUES(status_message_id)",
          [guildId, messageId]
        )
        .catch((error) => console.error(error));
    },
  };
})();

export default guildsTable;
