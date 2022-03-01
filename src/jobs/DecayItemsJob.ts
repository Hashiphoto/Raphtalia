import { Client } from "discord.js";
import InventoryService from "../services/Inventory.service";
import Job from "./Job";
import dayjs from "dayjs";
import { injectable } from "tsyringe";

@injectable()
export default class DecayItemsJob implements Job {
  public constructor(private _inventoryService: InventoryService) {}

  public async run(client: Client): Promise<void> {
    const now = dayjs();
    const guildStoreUpdates = client.guilds.cache.map(async (dsGuild) => {
      const allUserItems = await this._inventoryService.getAllUserItems(dsGuild);
      const expiredItems = allUserItems.filter(
        (item) => item.lifespanDays && dayjs(item.expirationDate).isBefore(now)
      );

      if (expiredItems.length) {
        return this._inventoryService.bulkReturnItemsToStore(dsGuild, expiredItems);
      }
    });

    await Promise.all(guildStoreUpdates);
  }
}
