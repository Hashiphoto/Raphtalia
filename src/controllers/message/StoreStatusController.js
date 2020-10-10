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
   * @returns {Promise<Discord.RichEmbed>}
   */
  async generateEmbed() {
    const storeFields = await this.getStoreFields();
    const statusEmbed = {
      color: 0x38a3e0,
      title: "Store",
      timestamp: new Date(),
      fields: storeFields,
      thumbnail: { url: this.guild.iconURL },
    };

    return statusEmbed;
  }

  /**
   * @returns {Promise<EmbedField[]>}
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
