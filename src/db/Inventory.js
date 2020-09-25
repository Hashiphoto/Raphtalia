import mysqlPromise from "mysql2/promise.js";
import AmbiguousInputError from "../structures/AmbiguousInputError.js";
import GuildItem from "../structures/GuildItem.js";
import Item from "../structures/Item.js";
import UserItem from "../structures/UserItem.js";

class Inventory {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
    this.guildSelect = "SELECT * FROM guild_inventory gi JOIN items i ON gi.item_id = i.id ";
    this.userSelect =
      "SELECT ui.user_id, ui.guild_id, i.id, ui.quantity, ui.remaining_uses, i.name, gi.max_uses " +
      "FROM user_inventory ui " +
      "JOIN items i ON ui.item_id = i.id " +
      "JOIN guild_inventory gi ON gi.item_id = i.id ";
  }

  async toGuildItem(row) {
    const commands = await this.getCommandsForItem(row.id);

    return new GuildItem(
      row.id,
      row.name,
      row.max_uses,
      row.quantity,
      commands,
      row.price,
      row.max_quantity
    );
  }

  async toUserItem(row) {
    const commands = await this.getCommandsForItem(row.id);

    return new UserItem(row.id, row.name, row.max_uses, row.quantity, commands, row.remaining_uses);
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
      .query(this.guildSelect + "WHERE guild_id = ?", [guildId])
      .then(([rows, fields]) => {
        return rows;
      })
      .then(async (dbRows) => {
        const items = [];

        for (const row of dbRows) {
          items.push(await this.toGuildItem(row));
        }

        return items;
      });
  }

  getGuildItem(guildId, itemName) {
    // TODO: Sanitize itemName
    return this.pool
      .query(this.guildSelect + `WHERE guild_id = ? AND name LIKE '${itemName}%'`, [guildId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }
        if (rows.length > 1) {
          throw new AmbiguousInputError(rows.map((r) => r.name));
        }

        return this.toGuildItem(rows[0]);
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
      [userId, guildId, item.id, item.quantity, item.maxUses, item.quantity]
    );
  }

  getUserInventory(guildId, userId) {
    return this.pool
      .query(this.userSelect + "WHERE ui.guild_id=? AND ui.user_id=?", [guildId, userId])
      .then(([rows, fields]) => {
        return rows;
      })
      .then(async (dbRows) => {
        const items = [];

        for (const row of dbRows) {
          items.push(await this.toUserItem(row));
        }

        return items;
      });
  }
}

export default Inventory;
