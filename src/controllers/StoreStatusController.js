import Discord from "discord.js";

import SingletonMessageController from "./SingletonMessageController.js";

class StoreStatusController extends SingletonMessageController {
  async update() {
    const statusEmbed = await this.generateEmbed();

    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Exit if no message to update
      if (!dbGuild || !dbGuild.storeMessageId) {
        return;
      }
      // Find the existing message and update it
      let textChannels = this.guild.channels
        .filter((channel) => channel.type === "text" && !channel.deleted)
        .array();
      for (let i = 0; i < textChannels.length; i++) {
        try {
          let message = await textChannels[i].fetchMessage(dbGuild.storeMessageId);
          message.edit({ embed: statusEmbed });
          break;
        } catch (e) {}
      }
    });
  }

  /**
   * @returns {Promise<Discord.RichEmbed>}
   */
  async generateEmbed() {
    const storeFields = await this.getStoreFields();
    const statusEmbed = {
      color: 0x73f094,
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

  removeMessage() {
    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Delete the existing status message, if it exists
      if (!dbGuild || !dbGuild.storeMessageId) {
        return;
      }

      return this.fetchMessage(dbGuild.storeMessageId).then((message) => {
        if (message) {
          return message.delete();
        }
      });
    });
  }

  setMessage(messageId) {
    return this.db.guilds.setStoreMessage(this.guild.id, messageId);
  }
}

export default StoreStatusController;
