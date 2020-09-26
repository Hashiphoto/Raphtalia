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

  findGuildItem(guildId, itemName) {
    // TODO: Sanitize itemName
    return this.pool
      .query(this.guildSelect + `WHERE guild_id = ? AND name LIKE '%${itemName}%'`, [guildId])
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

  /**
   * @param {String} guildId
   * @param {Item} item
   */
  updateGuildItemQuantity(guildId, item, quantityChange) {
    return this.pool.query(
      "UPDATE guild_inventory SET quantity=quantity+? WHERE guild_id=? AND item_id=?",
      [quantityChange, guildId, item.id]
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
        "ON DUPLICATE KEY UPDATE quantity=quantity+?, remaining_uses=remaining_uses+?",
      [userId, guildId, item.id, item.quantity, item.maxUses, item.quantity, item.maxUses]
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

  getUserItem(guildId, userId, itemId) {
    return this.pool
      .query(this.userSelect + "WHERE ui.guild_id=? AND ui.user_id=? AND i.id=?", [
        guildId,
        userId,
        itemId,
      ])
      .then(([rows, fields]) => this.toUserItem(rows[0]));
  }

  getUserItemByCommand(guildId, userId, commandName) {
    return this.pool
      .query(
        "SELECT i.id FROM user_inventory ui " +
          "JOIN items i ON ui.item_id = i.id " +
          "JOIN commands c ON c.item_id = i.id " +
          "WHERE ui.guild_id=? AND ui.user_id=? AND c.name LIKE ?",
        [guildId, userId, commandName]
      )
      .then(([rows, fields]) => {
        if (rows.length == 0) {
          return null;
        }
        return rows[0].id;
      })
      .then((itemId) => (itemId == null ? null : this.getUserItem(guildId, userId, itemId)));
  }

  updateUserItem(guildId, userId, item) {
    return this.pool.query(
      "UPDATE user_inventory SET quantity=?, remaining_uses=? " +
        "WHERE guild_id=? AND user_id=? AND item_id=?",
      [item.quantity, item.remainingUses, guildId, userId, item.id]
    );
  }

  deleteUserItem(guildId, userId, item) {
    return this.pool.query(
      "DELETE FROM user_inventory WHERE guild_id=? AND user_id=? AND item_id=?",
      [guildId, userId, item.id]
    );
  }
}

export default Inventory;
