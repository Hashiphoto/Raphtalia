import { FieldPacket, OkPacket, RowDataPacket } from "mysql2/promise";

import Fighter from "../models/Fighter";
import Repository from "./Repository";

export default class FighterRepository extends Repository {
  private select = "SELECT * FROM vw_fighters f ";

  public get(id: number): Promise<Fighter> {
    return this.pool
      .query(this.select + "WHERE id=?", [id])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return this.toFighter(rows[0]);
      });
  }

  public getByUser(guildId: string, userId: string): Promise<Fighter | undefined> {
    return this.pool
      .query(this.select + "WHERE f.guild_id=? AND f.user_id=?", [guildId, userId])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return undefined;
        }
        return this.toFighter(rows[0]);
      });
  }

  public async insert(guildId: string, userId: string): Promise<number> {
    return this.pool
      .query("INSERT INTO fighters (user_id, guild_id) VALUES (?,?)", [userId, guildId])
      .then(([result]: [OkPacket, FieldPacket[]]) => result.insertId as number);
  }

  public getOrCreate(guildId: string, userId: string): Promise<Fighter> {
    return this.getByUser(guildId, userId).then(async (fighter) => {
      if (fighter) {
        return fighter;
      }
      const insertId = await this.insert(guildId, userId);
      return this.get(insertId);
    });
  }

  public toFighter(row: RowDataPacket) {
    return new Fighter(
      row.id,
      row.user_id,
      row.guild_id,
      row.weapon_1,
      row.weapon_2,
      row.current_health,
      row.max_health
    );
  }
}
