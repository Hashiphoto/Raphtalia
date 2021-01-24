import { FieldPacket, Pool, RowDataPacket } from "mysql2/promise";

export default class ChannelsTable {
  private _pool: Pool;

  public constructor(pool: Pool) {
    this._pool = pool;
  }

  public get(channelId: string) {
    return this._pool
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

  public setAutoDelete(channelId: string, deleteDelay: number) {
    return this._pool
      .query(
        "INSERT INTO channels (id, delete_ms) VALUES (?,?) ON DUPLICATE KEY UPDATE delete_ms = VALUES(delete_ms)",
        [channelId, deleteDelay]
      )
      .catch((error) => console.error(error));
  }
}
