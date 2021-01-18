import AmbiguousInputError from "../structures/errors/AmbiguousInputError.js";
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
      parseFloat(row.price),
      row.max_quantity,
      row.sold_in_cycle,
      row.date_last_sold
    );
  }

  async toUserItem(row) {
    if (!row) {
      return null;
    }
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

  /**
   * @param {String} guildId
   * @returns {Promise<GuildItem[]>}
   */
  getGuildStock(guildId, showHidden = false) {
    return this.pool
      .query(this.guildSelect + "WHERE guild_id = ? " + `${showHidden ? "" : "AND hidden = 0"}`, [
        guildId,
      ])
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
    return this.pool
      .query(
        this.guildSelect +
          `WHERE guild_id = ? AND hidden = 0 AND name LIKE ${mysql.escape(`%${itemName}%`)}`,
        [guildId]
      )
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

  getGuildItem(guildId, itemId) {
    return this.pool
      .query(this.guildSelect + `WHERE guild_id = ? AND id=?`, [guildId, itemId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }

        return this.toGuildItem(rows[0]);
      });
  }

  /**
   * @param {String} guildId
   * @param {Item} item
   * @param {Number} quantityChange
   * @param {Date|null} soldDateTime
   * @returns {GuildItem} The item after updating
   */
  updateGuildItemQuantity(guildId, item, quantityChange, soldDateTime = null) {
    // If decreasing in quantity, increase sold_in_cycle
    const increaseSoldQuery =
      quantityChange < 0 ? `, sold_in_cycle=sold_in_cycle+${-quantityChange}` : ``;
    const updateDateSold = soldDateTime ? `, date_last_sold=${mysql.escape(soldDateTime)}` : ``;

    return this.pool
      .query(
        `UPDATE guild_inventory SET quantity=quantity+? ${updateDateSold} ${increaseSoldQuery} WHERE guild_id=? AND item_id=?`,
        [quantityChange, guildId, item.id]
      )
      .then(() => this.getGuildItem(guildId, item.id));
  }

  /**
   * @param {String} guildId
   * @param {Item} item
   * @returns {GuildItem} The item after updating
   */
  updateGuildItemSold(guildId, item, soldInCycle, soldDateTime) {
    return this.pool
      .query(
        `UPDATE guild_inventory SET sold_in_cycle=sold_in_cycle+?, date_last_sold=? WHERE guild_id=? AND item_id=?`,
        [soldInCycle, soldDateTime, guildId, item.id]
      )
      .then(() => this.getGuildItem(guildId, item.id));
  }

  updateGuildItemPrice(guildId, item, newPrice) {
    return this.pool.query("UPDATE guild_inventory SET price=? WHERE guild_id=? and item_id=?", [
      newPrice,
      guildId,
      item.id,
    ]);
  }

  /**
   * @param {String} guildId
   * @param {GuildItem} item
   */
  updateGuildItem(guildId, item) {
    return this.pool
      .query(
        "UPDATE guild_inventory SET price=?, max_uses=?, quantity=?, max_quantity=? WHERE guild_id=? AND item_id=?",
        [item.price, item.maxUses, item.quantity, item.maxQuantity, guildId, item.id]
      )
      .then(() => this.pool.query("UPDATE items SET name=? WHERE id=?", [item.name, item.id]));
  }

  resetStoreCycle(guildId) {
    return this.pool.query("UPDATE guild_inventory SET sold_in_cycle=0 WHERE guild_id=?", [
      guildId,
    ]);
  }

  findUserItem(guildId, userId, itemName, showHidden = false) {
    return this.pool
      .query(
        this.userSelect +
          `WHERE ui.guild_id=? AND ui.user_id=? AND i.name LIKE ${mysql.escape(`%${itemName}%`)} ` +
          `${showHidden ? "" : "AND hidden = 0"}`,
        [guildId, userId]
      )
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }

        return this.toUserItem(rows[0]);
      });
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

  getUserInventory(guildId, userId, showHidden = false) {
    return this.pool
      .query(
        this.userSelect +
          "WHERE ui.guild_id=? AND ui.user_id=?" +
          `${showHidden ? "" : "AND hidden = 0"}`,
        [guildId, userId]
      )
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

  /**
   * @param {String} guildId
   * @param {String} userId
   * @param {String} itemId
   */
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
