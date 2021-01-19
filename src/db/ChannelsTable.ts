import { FieldPacket, Pool, RowDataPacket } from "mysql2/promise";

class ChannelsTable {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  public get(channelId: string) {
    return this.pool
      .query("SELECT * FROM channels WHERE id = ?", [channelId])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return null;
        }
        return rows[0];
      })
      .catch((e) => {
        console.error(e);
      });
  }

  setAutoDelete(channelId: string, deleteDelay: number) {
    return this.pool
      .query(
        "INSERT INTO channels (id, delete_ms) VALUES (?,?) ON DUPLICATE KEY UPDATE delete_ms = VALUES(delete_ms)",
        [channelId, deleteDelay]
      )
      .catch((error) => console.error(error));
  }
}

export default ChannelsTable;
