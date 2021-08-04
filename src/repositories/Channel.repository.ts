import { FieldPacket, RowDataPacket } from "mysql2/promise";

import Repository from "./Repository";

class ChannelRepository extends Repository {
  public async get(channelId: string) {
    return this.pool
      .query("SELECT * FROM channels WHERE id = ?", [channelId])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return null;
        }
        return rows[0];
      });
  }

  public async setAutoDelete(channelId: string, deleteDelay: number): Promise<void> {
    await this.pool.query(
      "INSERT INTO channels (id, delete_ms) VALUES (?,?) ON DUPLICATE KEY UPDATE delete_ms = VALUES(delete_ms)",
      [channelId, deleteDelay]
    );
  }
}

export default ChannelRepository;
