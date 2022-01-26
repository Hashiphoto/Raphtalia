import { escape } from "mysql2";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import GuildItem from "../models/GuildItem";
import RaphError from "../models/RaphError";
import { listFormat } from "../utilities/Util";
import CommandRepository from "./Command.repository";
import Repository from "./Repository";

@injectable()
export default class GuildInventoryRepository extends Repository {
  public constructor(@inject(CommandRepository) private _commandRepository: CommandRepository) {
    super();
  }

  private guildSelect = "SELECT * FROM vw_guild_inventory ";

  public async getGuildStock(guildId: string, showHidden = false): Promise<GuildItem[]> {
    return this.pool
      .query(this.guildSelect + "WHERE guild_id = ? " + `${showHidden ? "" : "AND hidden = 0"}`, [
        guildId,
      ])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
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

  public async findGuildItem(guildId: string, itemName: string): Promise<GuildItem | undefined> {
    return this.pool
      .query(
        this.guildSelect +
          `WHERE guild_id = ? AND hidden = 0 AND name LIKE ${escape(`%${itemName}%`)}`,
        [guildId]
      )
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }
        if (rows.length > 1) {
          throw new RaphError(Result.AmbiguousInput, listFormat(rows.map((r) => r.name)));
        }

        return this.toGuildItem(rows[0]);
      });
  }

  public async getGuildItem(guildId: string, itemId: string): Promise<GuildItem> {
    return this.pool
      .query(this.guildSelect + `WHERE guild_id = ? AND item_id=?`, [guildId, itemId])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          throw new RaphError(Result.NotFound);
        }

        return this.toGuildItem(rows[0]);
      });
  }

  public async getGuildItemByCommand(
    guildId: string,
    commandName: string
  ): Promise<GuildItem | undefined> {
    return this.pool
      .query(
        "SELECT i.id FROM guild_inventory gi " +
          "JOIN items i ON gi.item_id = i.id " +
          "JOIN commands c ON c.item_id = i.id " +
          "WHERE gi.guild_id=? AND c.name LIKE ?",
        [guildId, commandName]
      )
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length == 0) {
          return;
        }
        return rows[0].id;
      })
      .then((itemId) => (itemId ? this.getGuildItem(guildId, itemId) : undefined));
  }

  public async updateGuildItemQuantity(
    guildId: string,
    item: GuildItem,
    quantityChange: number,
    soldDateTime?: Date
  ): Promise<void> {
    // If decreasing in quantity, increase sold_in_cycle
    const increaseSoldQuery =
      quantityChange < 0 ? `, sold_in_cycle=sold_in_cycle+${-quantityChange}` : ``;
    const updateDateSold = soldDateTime ? `, date_last_sold=${escape(soldDateTime)}` : ``;

    await this.pool.query(
      `UPDATE guild_inventory SET quantity=quantity+? ${updateDateSold} ${increaseSoldQuery} WHERE guild_id=? AND item_id=?`,
      [quantityChange, guildId, item.itemId]
    );
  }

  public async updateGuildItemSold(
    guildId: string,
    item: GuildItem,
    soldInCycle: number,
    soldDateTime: Date
  ): Promise<void> {
    await this.pool.query(
      `UPDATE guild_inventory SET sold_in_cycle=sold_in_cycle+?, date_last_sold=? WHERE guild_id=? AND item_id=?`,
      [soldInCycle, soldDateTime, guildId, item.itemId]
    );
  }

  public async updateGuildItemPrice(
    guildId: string,
    item: GuildItem,
    newPrice: number
  ): Promise<void> {
    await this.pool.query("UPDATE guild_inventory SET price=? WHERE guild_id=? and item_id=?", [
      newPrice,
      guildId,
      item.itemId,
    ]);
  }

  public async resetStoreCycle(guildId: string): Promise<void> {
    await this.pool.query("UPDATE guild_inventory SET sold_in_cycle=0 WHERE guild_id=?", [guildId]);
  }

  private async toGuildItem(row: RowDataPacket) {
    const commands = await this._commandRepository.getCommandsForItem(row.item_id);
    return new GuildItem(
      row.item_id,
      row.guild_id,
      row.name,
      row.max_uses,
      row.quantity,
      row.steal_protected,
      commands,
      parseFloat(row.price),
      row.max_quantity,
      row.sold_in_cycle,
      row.date_last_sold
    );
  }
}
