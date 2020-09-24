import mysqlPromise from "mysql2/promise.js";
import AmbiguousInputError from "../structures/AmbiguousInputError.js";
import Item from "../structures/Item.js";

class Inventory {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
    this.baseQuery = "SELECT * FROM guild_inventory gi JOIN items i ON gi.item_id = i.id ";
  }

  async dbRowToItem(row) {
    const commands = await this.getCommandsForItem(row.id);

    return new Item(
      row.id,
      row.name,
      row.price,
      row.starting_uses,
      row.quantity,
      row.max_quantity,
      commands
    );
  }

  getCommandsForItem(itemId) {
    return this.pool
      .query("SELECT * FROM commands WHERE item_id = ?", itemId)
      .then(([rows, fields]) => {
        return rows;
      });
  }

  getGuildStock(guildId) {
    return this.pool
      .query(this.baseQuery + "WHERE guild_id = ?", [guildId])
      .then(([rows, fields]) => {
        return rows;
      })
      .then(async (dbRows) => {
        const items = [];

        for (const row of dbRows) {
          items.push(await this.dbRowToItem(row));
        }

        return items;
      });
  }

  getItem(guildId, itemName) {
    // TODO: Sanitize itemName
    return this.pool
      .query(this.baseQuery + `WHERE guild_id = ? AND name LIKE '${itemName}%'`, [guildId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }
        if (rows.length > 1) {
          throw new AmbiguousInputError(rows.map((r) => r.name));
        }

        return this.dbRowToItem(rows[0]);
      });
  }

  updateGuildItem(guildId, item) {
    return this.pool.query(
      "UPDATE guild_inventory SET price=?, quantity=?, max_quantity=? WHERE guild_id=? AND item_id=?",
      [item.price, item.quantity, item.maxQuantity, guildId, item.id]
    );
  }

  /**
   * @param {String} guildId
   * @param {String} userId
   * @param {Item} item
   */
  insertUserItem(guildId, userId, item) {
    return this.pool.query(
      "INSERT INTO user_inventory " +
        "VALUES (?,?,?,?,?) " +
        "ON DUPLICATE KEY UPDATE quantity=quantity+?",
      [userId, guildId, item.id, item.quantity, item.startingUses, item.quantity]
    );
  }
}

export default Inventory;
