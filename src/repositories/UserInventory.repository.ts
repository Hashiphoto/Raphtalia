import { escape, OkPacket } from "mysql2";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { inject, injectable } from "tsyringe";
import GuildItem from "../models/GuildItem";
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
  ): Promise<UserItem[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await this.pool.query(
      this.selectUserItem +
        `WHERE guild_id=? AND user_id=? AND name LIKE ${escape(`%${itemName}%`)} ` +
        `${showHidden ? "" : "AND hidden = 0"}`,
      [guildId, userId]
    );
    return Promise.all(rows.map((r) => this.toUserItem(r)));
  }

  public async insertUserItem(guildId: string, userId: string, item: UserItem): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_inventory (user_id, guild_id, item_id, quantity, remaining_uses) VALUES (?,?,?,?,?)`,
      [userId, guildId, item.itemId, item.quantity, item.maxUses]
    );
  }

  public async transferUserItem(toMemberId: string, item: UserItem): Promise<void> {
    await this.pool.query(`UPDATE user_inventory SET user_id=? WHERE id=?`, [toMemberId, item.id]);
  }

  /**
   * User has purchased an item. Insert a new db row
   * @returns the id number inserted
   */
  public async createUserItem(guildId: string, userId: string, item: GuildItem): Promise<number> {
    return this.pool
      .query(
        `INSERT INTO user_inventory (user_id, guild_id, item_id, quantity, remaining_uses) VALUES (?,?,?,?,?)`,
        [userId, guildId, item.itemId, item.quantity, item.maxUses]
      )
      .then(([result]: [OkPacket, FieldPacket[]]) => result.insertId);
  }

  public async listUserItems(
    guildId: string,
    userId?: string,
    showHidden = false
  ): Promise<UserItem[]> {
    const queryString =
      this.selectUserItem +
      `WHERE guild_id=${escape(guildId)}` +
      (userId ? ` AND user_id=${escape(userId)}` : "") +
      (showHidden ? "" : ` AND hidden=0`);

    return this.pool
      .query(queryString)
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return rows;
      })
      .then(async (dbRows) => {
        return Promise.all(dbRows.map((row) => this.toUserItem(row)));
      });
  }

  public async getUserItemsByItemId(
    guildId: string,
    userId: string,
    itemId: string
  ): Promise<UserItem[]> {
    return this.pool
      .query(this.selectUserItem + "WHERE guild_id=? AND user_id=? AND item_id=?", [
        guildId,
        userId,
        itemId,
      ])
      .then(async ([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return Promise.all(rows.map((r) => this.toUserItem(r)));
      });
  }

  public async getUserItemsByCommand(
    guildId: string,
    userId: string,
    commandName: string
  ): Promise<UserItem[]> {
    const itemId = await this.pool
      .query("SELECT item_id FROM commands WHERE name LIKE ?", [commandName])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.length ? rows[0].item_id : undefined;
      });
    if (!itemId) {
      return [];
    }
    return this.getUserItemsByItemId(guildId, userId, itemId);
  }

  public async getUserItem(id: number): Promise<UserItem | undefined> {
    return this.pool
      .query(this.selectUserItem + `WHERE id=?`, [id])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return undefined;
        }
        return this.toUserItem(rows[0]);
      });
  }

  public async updateUserItem(guildId: string, userId: string, item: UserItem): Promise<void> {
    // TODO: Remove/rework this to use id primarily
    const idQuery = item.id ? ` AND id=${item.id}` : "";
    await this.pool.query(
      "UPDATE user_inventory SET quantity=?, remaining_uses=? " +
        "WHERE guild_id=? AND user_id=? AND item_id=?" +
        idQuery,
      [item.quantity, item.remainingUses, guildId, userId, item.itemId]
    );
  }

  public async deleteUserItem(guildId: string, userId: string, item: UserItem): Promise<void> {
    const idQuery = item.id ? ` AND id=${item.id}` : "";
    await this.pool.query(
      "DELETE FROM user_inventory WHERE guild_id=? AND user_id=? AND item_id=?" + idQuery,
      [guildId, userId, item.itemId]
    );
  }

  public async findUsersWithItem(guildId: string, itemId: string): Promise<UserItem[]> {
    return this.pool
      .query(`${this.selectUserItem} WHERE guild_id=? AND item_id=?`, [guildId, itemId])
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

  private async toUserItem(row: RowDataPacket): Promise<UserItem> {
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
      row.user_id,
      row.id
    );
  }
}
