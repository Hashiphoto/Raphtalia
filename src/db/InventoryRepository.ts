import { FieldPacket, RowDataPacket } from "mysql2/promise";

import AmbiguousInputError from "../structures/errors/AmbiguousInputError";
import CommandItem from "../structures/CommandItem";
import GuildItem from "../structures/GuildItem";
import Item from "../structures/Item";
import Repository from "./Repository";
import UserItem from "../structures/UserItem";
import { escape } from "mysql2";

export default class InventoryRepository extends Repository {
  private guildSelect: string =
    "SELECT * FROM guild_inventory gi JOIN items i ON gi.item_id = i.id ";
  private userSelect: string =
    "SELECT ui.user_id, ui.guild_id, i.id, ui.quantity, ui.remaining_uses, i.name, gi.max_uses " +
    "FROM user_inventory ui " +
    "JOIN items i ON ui.item_id = i.id " +
    "JOIN guild_inventory gi ON gi.item_id = i.id ";

  public async getGuildStock(guildId: string, showHidden = false) {
    return this.pool
      .query(this.guildSelect + "WHERE guild_id = ? " + `${showHidden ? "" : "AND hidden = 0"}`, [
        guildId,
      ])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
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

  public async findGuildItem(guildId: string, itemName: string) {
    return this.pool
      .query(
        this.guildSelect +
          `WHERE guild_id = ? AND hidden = 0 AND name LIKE ${escape(`%${itemName}%`)}`,
        [guildId]
      )
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }
        if (rows.length > 1) {
          throw new AmbiguousInputError(rows.map((r) => r.name));
        }

        return this.toGuildItem(rows[0]);
      });
  }

  public async getGuildItem(guildId: string, itemId: string) {
    return this.pool
      .query(this.guildSelect + `WHERE guild_id = ? AND id=?`, [guildId, itemId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }

        return this.toGuildItem(rows[0]);
      });
  }

  public async updateGuildItemQuantity(
    guildId: string,
    item: Item,
    quantityChange: number,
    soldDateTime?: Date
  ) {
    // If decreasing in quantity, increase sold_in_cycle
    const increaseSoldQuery =
      quantityChange < 0 ? `, sold_in_cycle=sold_in_cycle+${-quantityChange}` : ``;
    const updateDateSold = soldDateTime ? `, date_last_sold=${escape(soldDateTime)}` : ``;

    return this.pool
      .query(
        `UPDATE guild_inventory SET quantity=quantity+? ${updateDateSold} ${increaseSoldQuery} WHERE guild_id=? AND item_id=?`,
        [quantityChange, guildId, item.id]
      )
      .then(() => this.getGuildItem(guildId, item.id));
  }

  public async updateGuildItemSold(
    guildId: string,
    item: Item,
    soldInCycle: number,
    soldDateTime: Date
  ) {
    return this.pool
      .query(
        `UPDATE guild_inventory SET sold_in_cycle=sold_in_cycle+?, date_last_sold=? WHERE guild_id=? AND item_id=?`,
        [soldInCycle, soldDateTime, guildId, item.id]
      )
      .then(() => this.getGuildItem(guildId, item.id));
  }

  public async updateGuildItemPrice(guildId: string, item: Item, newPrice: number) {
    return this.pool.query("UPDATE guild_inventory SET price=? WHERE guild_id=? and item_id=?", [
      newPrice,
      guildId,
      item.id,
    ]);
  }

  public async updateGuildItem(guildId: string, item: GuildItem) {
    return this.pool
      .query(
        "UPDATE guild_inventory SET price=?, max_uses=?, quantity=?, max_quantity=? WHERE guild_id=? AND item_id=?",
        [item.price, item.maxUses, item.quantity, item.maxQuantity, guildId, item.id]
      )
      .then(() => this.pool.query("UPDATE items SET name=? WHERE id=?", [item.name, item.id]));
  }

  public async resetStoreCycle(guildId: string) {
    return this.pool.query("UPDATE guild_inventory SET sold_in_cycle=0 WHERE guild_id=?", [
      guildId,
    ]);
  }

  public async findUserItem(guildId: string, userId: string, itemName: string, showHidden = false) {
    return this.pool
      .query(
        this.userSelect +
          `WHERE ui.guild_id=? AND ui.user_id=? AND i.name LIKE ${escape(`%${itemName}%`)} ` +
          `${showHidden ? "" : "AND hidden = 0"}`,
        [guildId, userId]
      )
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }

        return this.toUserItem(rows[0]);
      });
  }

  public async insertUserItem(guildId: string, userId: string, item: Item) {
    return this.pool.query(
      "INSERT INTO user_inventory (user_id, guild_id, item_id, quantity, remaining_uses)" +
        "VALUES (?,?,?,?,?) " +
        "ON DUPLICATE KEY UPDATE quantity=quantity+?, remaining_uses=remaining_uses+?",
      [userId, guildId, item.id, item.quantity, item.maxUses, item.quantity, item.maxUses]
    );
  }

  public async getUserItems(
    guildId: string,
    userId: string,
    showHidden = false
  ): Promise<UserItem[]> {
    return this.pool
      .query(
        this.userSelect +
          "WHERE ui.guild_id=? AND ui.user_id=?" +
          `${showHidden ? "" : "AND hidden = 0"}`,
        [guildId, userId]
      )
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows;
      })
      .then(async (dbRows) => {
        const items = [];

        for (const row of dbRows) {
          const userItem = await this.toUserItem(row);
          if (userItem) {
            items.push(userItem);
          }
        }

        return items;
      });
  }

  public async getUserItem(guildId: string, userId: string, itemId: string) {
    return this.pool
      .query(this.userSelect + "WHERE ui.guild_id=? AND ui.user_id=? AND i.id=?", [
        guildId,
        userId,
        itemId,
      ])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => this.toUserItem(rows[0]));
  }

  public async getUserItemByCommand(guildId: string, userId: string, commandName: string) {
    return this.pool
      .query(
        "SELECT i.id FROM user_inventory ui " +
          "JOIN items i ON ui.item_id = i.id " +
          "JOIN commands c ON c.item_id = i.id " +
          "WHERE ui.guild_id=? AND ui.user_id=? AND c.name LIKE ?",
        [guildId, userId, commandName]
      )
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length == 0) {
          return null;
        }
        return rows[0].id;
      })
      .then((itemId) => (itemId == null ? null : this.getUserItem(guildId, userId, itemId)));
  }

  public async updateUserItem(guildId: string, userId: string, item: UserItem) {
    return this.pool.query(
      "UPDATE user_inventory SET quantity=?, remaining_uses=? " +
        "WHERE guild_id=? AND user_id=? AND item_id=?",
      [item.quantity, item.remainingUses, guildId, userId, item.id]
    );
  }

  public async deleteUserItem(guildId: string, userId: string, item: UserItem) {
    return this.pool.query(
      "DELETE FROM user_inventory WHERE guild_id=? AND user_id=? AND item_id=?",
      [guildId, userId, item.id]
    );
  }

  private async getCommandsForItem(itemId: number) {
    return this.pool
      .query(
        "SELECT c.*, i.id as item_id, i.name as item_name FROM commands c JOIN items i ON c.item_id = i.id WHERE c.item_id = ?",
        itemId
      )
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map(this.toCommandItem);
      });
  }

  private async toGuildItem(row: RowDataPacket) {
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

  private async toUserItem(row: RowDataPacket) {
    if (!row) {
      return;
    }
    const commands = await this.getCommandsForItem(row.id);

    return new UserItem(row.id, row.name, row.max_uses, row.quantity, commands, row.remaining_uses);
  }

  private toCommandItem(row: RowDataPacket) {
    return new CommandItem(row.id, row.name, row.item_id, row.item_name);
  }
}
