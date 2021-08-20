import { Client } from "discord.js";
import GuildInventoryRepository from "../repositories/GuildInventory.repository";
import GuildRepository from "../repositories/Guild.repository";
import GuildStoreService from "../services/message/GuildStore.service";
import Job from "./Job";
import dayjs from "dayjs";
import { injectable } from "tsyringe";

@injectable()
export default class DropPricesJob implements Job {
  public constructor(
    private _guildRepository: GuildRepository,
    private _guildInventoryRepository: GuildInventoryRepository,
    private _guildStoreService: GuildStoreService
  ) {}

  public async run(client: Client): Promise<void> {
    const guildStoreUpdates = client.guilds.cache.map(async (guild) => {
      const dbGuild = await this._guildRepository.get(guild.id);
      if (!dbGuild) {
        return;
      }
      const guildItems = await this._guildInventoryRepository.getGuildStock(guild.id);
      for (const item of guildItems) {
        // Don't let sold-out items depreciate for no reason
        // Also, don't change the price of explictly set free items
        if (item.soldInCycle !== 0 || item.quantity === 0 || item.price === 0) {
          continue;
        }
        const hoursSinceLastSold = dayjs.duration(dayjs().diff(dayjs(item.dateLastSold))).asHours();
        const daysSinceLastSold = Math.floor(hoursSinceLastSold / 24);
        const salePercentage =
          Math.ceil(daysSinceLastSold / dbGuild.priceDropDays) * dbGuild.priceDropRate;

        let newPrice = item.price * (1.0 - salePercentage);
        if (newPrice <= 0.01) {
          newPrice = 0.01;
        }
        await this._guildInventoryRepository.updateGuildItemPrice(guild.id, item, newPrice);
      }
      await this._guildInventoryRepository.resetStoreCycle(guild.id);
      await this._guildStoreService.update(guild);
    });

    await Promise.all(guildStoreUpdates);
  }
}
