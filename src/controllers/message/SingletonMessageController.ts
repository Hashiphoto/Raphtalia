import Discord, { MessageEmbed } from "discord.js";

import Database from "../../db/Database.js";
import ExecutionContext from "../../structures/ExecutionContext.js";
import GuildBasedController from "../Controller.js";

class SingletonMessageController extends GuildBasedController {
  public guildProperty: string;
  public db: any;
  public guild: any;

  constructor(context: ExecutionContext) {
    super(context);
    this.guildProperty = "";
  }

  async update() {
    const statusEmbed = await this.generateEmbed();

    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Exit if no message to update
      if (!dbGuild || !dbGuild[this.guildProperty]) {
        return;
      }

      return this.fetchMessage(dbGuild[this.guildProperty]).then(
        (message) => message && message.edit({ embed: statusEmbed })
      );
    });
  }

  /**
   * @returns {Promise<Discord.MessageEmbed>}
   */
  async generateEmbed(): Promise<MessageEmbed> {
    throw new Error("This function must be overriden");
  }

  removeMessage() {
    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Delete the existing status message, if it exists
      if (!dbGuild || !dbGuild[this.guildProperty]) {
        return;
      }

      return this.fetchMessage(dbGuild[this.guildProperty]).then((message) => {
        return message && !message.deleted && message.delete();
      });
    });
  }

  setMessage(messageId) {
    throw new Error("This function must be overriden");
  }

  async fetchMessage(messageId) {
    let textChannels = this.guild.channels.cache
      .filter((channel) => channel.type === "text" && !channel.deleted)
      .array();

    for (const channel of textChannels) {
      try {
        const message = await channel.messages.fetch(messageId);
        return message;
      } catch (error) {
        if (
          error.name === "DiscordAPIError" &&
          (error.message === "Unknown Message" || error.message === "Missing Access")
        ) {
          continue;
        }
        console.error(error);
      }
    }
  }
}

export default SingletonMessageController;
