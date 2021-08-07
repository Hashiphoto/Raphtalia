import { FieldPacket, RowDataPacket } from "mysql2/promise";

import Item from "../models/Item";
import Repository from "./Repository";
import UserItem from "../models/UserItem";
import { escape } from "mysql2";

export default class UserInventoryRepository extends Repository {
  private selectUserItem = "SELECT * FROM vw_user_inv_complete";

  public async findUserItem(guildId: string, userId: string, itemName: string, showHidden = false) {
    return this.pool
      .query(
        this.selectUserItem +
          `WHERE guild_id=? AND user_id=? AND name LIKE ${escape(`%${itemName}%`)} ` +
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

  public async insertUserItem(guildId: string, userId: string, item: Item): Promise<void> {
    await this.pool.query(
      "INSERT INTO user_inventory (user_id, guild_id, item_id, quantity, remaining_uses)" +
        "VALUES (?,?,?,?,?) " +
        "ON DUPLICATE KEY UPDATE quantity=quantity+?, remaining_uses=remaining_uses+?, date_purchased=CURRENT_TIMESTAMP",
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
        this.selectUserItem +
          "WHERE guild_id=? AND user_id=?" +
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

  public async getUserItem(guildId: string, userId: string, itemId: string): Promise<UserItem> {
    return this.pool
      .query(this.selectUserItem + "WHERE guild_id=? AND user_id=? AND item_id=?", [
        guildId,
        userId,
        itemId,
      ])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => this.toUserItem(rows[0]));
  }

  public async getUserItemByCommand(
    guildId: string,
    userId: string,
    commandName: string
  ): Promise<UserItem | undefined> {
    return this.pool
      .query(this.selectUserItem + "WHERE guild_id=? AND user_id=? AND name LIKE ?", [
        guildId,
        userId,
        commandName,
      ])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length == 0) {
          return;
        }
        return rows[0].id;
      })
      .then((itemId) => (itemId ? this.getUserItem(guildId, userId, itemId) : undefined));
  }

  public async updateUserItem(guildId: string, userId: string, item: UserItem): Promise<void> {
    await this.pool.query(
      "UPDATE user_inventory SET quantity=?, remaining_uses=? " +
        "WHERE guild_id=? AND user_id=? AND item_id=?",
      [item.quantity, item.remainingUses, guildId, userId, item.id]
    );
  }

  public async deleteUserItem(guildId: string, userId: string, item: UserItem): Promise<void> {
    await this.pool.query(
      "DELETE FROM user_inventory WHERE guild_id=? AND user_id=? AND item_id=?",
      [guildId, userId, item.id]
    );
  }

  public async findUsersWithItem(guildId: string, itemId: string): Promise<UserItem[]> {
    return this.pool
      .query(`${this.selectUserItem} WHERE guild_id=? AND i.id=?`, [guildId, itemId])
      .then(async ([rows]: [RowDataPacket[], FieldPacket[]]) => {
        const items = [];
        for (const r of rows) {
          items.push(await this.toUserItem(r));
        }
        return items;
      });
  }

  private async toUserItem(row: RowDataPacket) {
    if (!row) {
      throw new Error("row is undefined");
    }

    return new UserItem(
      row.id,
      row.guild_id,
      row.name,
      row.max_uses,
      row.quantity,
      undefined,
      row.steal_protected,
      row.remaining_uses,
      row.date_purchased,
      row.user_id
    );
  }
}
