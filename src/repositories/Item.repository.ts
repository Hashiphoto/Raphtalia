import { FieldPacket, RowDataPacket } from "mysql2/promise";

import ItemCommand from "../models/ItemCommand";
import Repository from "./Repository";

export default class ItemRepository extends Repository {
  public async getCommandsForItem(itemId: string): Promise<ItemCommand[]> {
    return this.pool
      .query(
        "SELECT c.*, i.id as item_id, i.name as item_name FROM commands c JOIN items i ON c.item_id = i.id WHERE c.item_id = ?",
        itemId
      )
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map(this.toItemCommand);
      });
  }

  private toItemCommand(row: RowDataPacket) {
    return new ItemCommand(row.id, row.name, row.item_id);
  }
}
