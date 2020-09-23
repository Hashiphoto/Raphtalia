import mysqlPromise from "mysql2/promise.js";
import Item from "../structures/Item.js";

class GuildInventory {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  getCommandsForItem(itemId) {
    return this.pool
      .query("SELECT * FROM commands WHERE item_id = ?", itemId)
      .then(([rows, fields]) => {
        return rows;
      });
  }

  get(guildId) {
    return this.pool
      .query(
        "SELECT * " +
          "FROM guild_inventory gi " +
          "JOIN items i ON gi.item_id = i.id " +
          "WHERE guild_id = ?",
        [guildId]
      )
      .then(([rows, fields]) => {
        return rows;
      })
      .then(async (dbItems) => {
        const items = [];

        for (const item of dbItems) {
          const commands = await this.getCommandsForItem(item.id);

          items.push(
            new Item(
              item.id,
              item.name,
              item.price,
              item.starting_uses,
              item.quantity,
              item.max_quantity,
              commands
            )
          );
        }

        return items;
      });
  }
}

export default GuildInventory;
