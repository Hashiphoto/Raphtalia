import mysqlPromise from "mysql2/promise";

class ChannelsTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  get(channelId) {
    return this.pool
      .query("SELECT * FROM channels WHERE id = ?", [channelId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }
        return rows[0];
      })
      .catch((e) => {
        console.error(e);
      });
  }

  setAutoDelete(channelId, deleteDelay) {
    return this.pool
      .query(
        "INSERT INTO channels (id, delete_ms) VALUES (?,?) ON DUPLICATE KEY UPDATE delete_ms = VALUES(delete_ms)",
        [channelId, deleteDelay]
      )
      .catch((error) => console.error(error));
  }
}

export default ChannelsTable;
