import dayjs from "dayjs";
import { Client } from "discord.js";
import { injectable } from "tsyringe";
import UserInventoryRepository from "../repositories/UserInventory.repository";
import Job from "./Job";

@injectable()
export default class DecayItemsJob implements Job {
  public constructor(private _userInventoryRepository: UserInventoryRepository) {}

  public async run(client: Client): Promise<void> {
    const now = dayjs();
    const guildStoreUpdates = client.guilds.cache.map(async (dsGuild) => {
      const allUserItems = await this._userInventoryRepository.listUserItems(dsGuild.id);
      const expiredItems = allUserItems.filter(
        (item) =>
          item.lifespanDays && dayjs(item.datePurchased).add(item.lifespanDays, "day").isBefore(now)
      );

      if (expiredItems.length) {
        return this._userInventoryRepository.deleteUserItems(dsGuild.id, expiredItems);
      }
    });

    await Promise.all(guildStoreUpdates);
  }
}
