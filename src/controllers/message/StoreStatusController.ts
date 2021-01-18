import Discord from "discord.js";

import SingletonMessageController from "./SingletonMessageController.js";

class StoreStatusController extends SingletonMessageController {
  /**
   * @param {Database} db
   * @param {Discord.Guild} guild
   */
  constructor(db, guild) {
    super(db, guild);
    this.guildProperty = "storeMessageId";
  }

  /**
   * @returns {Promise<Discord.MessageEmbed>}
   */
  async generateEmbed() {
    const storeFields = await this.getStoreFields();
    const statusEmbed = new Discord.MessageEmbed()
      .setColor(0xe3c91e)
      .setTitle("Store")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/b8xakAL.png")
      .addFields(storeFields);

    return statusEmbed;
  }

  /**
   * @returns {Promise<Discord.EmbedFieldData[]>}
   */
  async getStoreFields() {
    const fields = [];

    const items = await this.db.inventory.getGuildStock(this.guild.id);

    const itemFields = items.map((item) => {
      return {
        name: item.name,
        value: item.getDetails(),
        inline: true,
      };
    });

    return fields.concat(itemFields);
  }

  setMessage(messageId) {
    return this.db.guilds.setStoreMessage(this.guild.id, messageId);
  }
}

export default StoreStatusController;
