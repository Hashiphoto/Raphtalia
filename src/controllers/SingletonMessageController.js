import Discord from "discord.js";

import GuildBasedController from "./GuildBasedController.js";

class SingletonMessageController extends GuildBasedController {
  async update() {
    throw new Error("This function must be overriden");
  }

  /**
   * @returns {Promise<Discord.RichEmbed>}
   */
  async generateEmbed() {
    throw new Error("This function must be overriden");
  }

  /**
   * @returns {Promise<EmbedField[]>}
   */
  async getFields() {
    throw new Error("This function must be overriden");
  }

  removeMessage() {
    throw new Error("This function must be overriden");
  }

  setMessage(messageId) {
    throw new Error("This function must be overriden");
  }

  async fetchMessage(messageId) {
    let textChannels = this.guild.channels
      .filter((channel) => channel.type === "text" && !channel.deleted)
      .array();

    for (const channel of textChannels) {
      try {
        const message = await channel.fetchMessage(messageId);
        return message;
      } catch (error) {
        if (error.name === "DiscordAPIError" && error.message === "Unknown Message") {
          continue;
        }
        console.error(error);
      }
    }
  }
}

export default SingletonMessageController;
