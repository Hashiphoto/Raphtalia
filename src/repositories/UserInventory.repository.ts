import { escape } from "mysql2";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import Item from "../models/Item";
import RaphError from "../models/RaphError";
import UserItem from "../models/UserItem";
import CommandRepository from "./Command.repository";
import Repository from "./Repository";

@injectable()
export default class UserInventoryRepository extends Repository {
  public constructor(@inject(CommandRepository) private _commandRepository: CommandRepository) {
    super();
  }

  private selectUserItem = "SELECT * FROM vw_user_inv_complete ";

  public async findUserItemByName(
    guildId: string,
    userId: string,
    itemName: string,
    showHidden = false
  ): Promise<UserItem | undefined> {
    return this.pool
      .query(
        this.selectUserItem +
          `WHERE guild_id=? AND user_id=? AND name LIKE ${escape(`%${itemName}%`)} ` +
          `${showHidden ? "" : "AND hidden = 0"}`,
        [guildId, userId]
      )
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
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

  public async getUserItem(
    guildId: string,
    userId: string,
    itemId: string
  ): Promise<UserItem | undefined> {
    return this.pool
      .query(this.selectUserItem + "WHERE guild_id=? AND user_id=? AND item_id=?", [
        guildId,
        userId,
        itemId,
      ])
      .then(async ([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (!rows.length) {
          return;
        }
        return (await this.toUserItem(rows[0])) as UserItem;
      });
  }

  public async getUserItemByCommand(
    guildId: string,
    userId: string,
    commandName: string
  ): Promise<UserItem | undefined> {
    return this.pool
      .query("SELECT item_id FROM commands WHERE name LIKE ?", [commandName])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          throw new RaphError(Result.NotFound);
        }
        return rows[0].item_id;
      })
      .then((itemId) => this.getUserItem(guildId, userId, itemId));
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
          const userItem = await this.toUserItem(r);
          if (userItem) {
            items.push(userItem);
          }
        }
        return items;
      });
  }

  private async toUserItem(row: RowDataPacket) {
    if (!row) {
      return;
    }
    const commands = await this._commandRepository.getCommandsForItem(row.item_id);
    return new UserItem(
      row.item_id,
      row.guild_id,
      row.name,
      row.max_uses,
      row.quantity,
      row.steal_protected,
      commands,
      row.price,
      row.maxQuantity,
      row.soldInCycle,
      row.dateLastSold,
      row.remaining_uses,
      row.date_purchased,
      row.user_id
    );
  }
}
