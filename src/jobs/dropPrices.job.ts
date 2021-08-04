import { Client } from "discord.js";

const dropStorePrices = async (client: Client) => {
  const guildStoreUpdates = client.guilds.cache.map(async (guild) => {
    const dbGuild = await this.db.guilds.get(guild.id);

    if (!dbGuild) {
      return;
    }

    return this.db.inventory
      .getGuildStock(guild.id)
      .then(async (guildItems) => {
        for (const item of guildItems) {
          // Don't let sold-out items depreciate for no reason
          // Also, don't change the price of explictly set free items
          if (item.soldInCycle !== 0 || item.quantity === 0 || item.price === 0) {
            continue;
          }
          const hoursSinceLastSold = dayjs
            .duration(dayjs().diff(dayjs(item.dateLastSold)))
            .asHours();
          const daysSinceLastSold = Math.floor(hoursSinceLastSold / 24);
          const salePercentage =
            Math.ceil(daysSinceLastSold / dbGuild.priceDropDays) * dbGuild.priceDropRate;

          let newPrice = item.price * (1.0 - salePercentage);
          if (newPrice <= 0.01) {
            newPrice = 0.01;
          }
          await this.db.inventory.updateGuildItemPrice(guild.id, item, newPrice);
        }
      })
      .then(() => this.db.inventory.resetStoreCycle(guild.id))
      .then(() => {
        const context = new ExecutionContext(this.db, this.client, guild);
        new StoreStatusController(context).update();
      });
  });

  return Promise.all(guildStoreUpdates);
};

export { dropStorePrices };
