import { FieldPacket, RowDataPacket } from "mysql2/promise";

import Guild from "../models/Guild";
import Repository from "./Repository";

export default class GuildRepository extends Repository {
  public async get(guildId: string): Promise<Guild | undefined> {
    return this.pool
      .query("SELECT * FROM guilds WHERE id = ?", [guildId])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }
        return this.toGuildObject(rows[0]);
      });
  }

  public async setMessageRate(guildId: string, messagePayout: number): Promise<void> {
    await this.pool.query(
      "INSERT INTO guilds (id, message_rate) VALUES (?,?) ON DUPLICATE KEY UPDATE message_rate = VALUES(message_rate)",
      [guildId, messagePayout]
    );
  }

  public async setCensorship(guildId: string, enabled: boolean): Promise<void> {
    await this.pool.query(
      "INSERT INTO guilds (id, censorship_enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE censorship_enabled = VALUES(censorship_enabled)",
      [guildId, enabled]
    );
  }

  public async setRoleMessage(guildId: string, messageId: string): Promise<void> {
    await this.pool.query(
      "INSERT INTO guilds (id, role_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE role_message_id = VALUES(role_message_id)",
      [guildId, messageId]
    );
  }

  public async setStoreMessage(guildId: string, messageId: string): Promise<void> {
    await this.pool.query(
      "INSERT INTO guilds (id, store_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE store_message_id = VALUES(store_message_id)",
      [guildId, messageId]
    );
  }

  public async setBanListMessage(guildId: string, messageId: string): Promise<void> {
    await this.pool.query(
      "INSERT INTO guilds (id, ban_list_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE ban_list_message_id = VALUES(ban_list_message_id)",
      [guildId, messageId]
    );
  }

  private toGuildObject(dbRow: RowDataPacket) {
    return new Guild(
      dbRow.id,
      dbRow.censorship_enabled,
      dbRow.tax_rate,
      dbRow.role_message_id,
      dbRow.store_message_id,
      dbRow.ban_list_message_id,
      dbRow.message_rate,
      dbRow.message_reset_s,
      dbRow.reactor_rate,
      dbRow.reactee_rate,
      dbRow.price_hike_coefficient,
      dbRow.price_drop_days,
      dbRow.price_drop_rate,
      dbRow.output_channel
    );
  }
}
