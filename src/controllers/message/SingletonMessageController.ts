import Discord, { MessageEmbed, TextChannel } from "discord.js";

import DbGuild from "../../structures/DbGuild.js";
import ExecutionContext from "../../structures/ExecutionContext.js";
import GuildBasedController from "../Controller.js";

export default class SingletonMessageController extends GuildBasedController {
  public guildProperty: string;

  public constructor(context: ExecutionContext) {
    super(context);
    this.guildProperty = "";
  }

  public async update() {
    const statusEmbed = await this.generateEmbed();

    return this.ec.db.guilds.get(this.ec.guild.id).then(async (dbGuild) => {
      // Exit if no message to update
      if (!dbGuild || !dbGuild[this.guildProperty as keyof DbGuild]) {
        return;
      }

      return this.fetchMessage(dbGuild[this.guildProperty as keyof DbGuild] as string).then(
        (message) => message && message.edit({ embed: statusEmbed })
      );
    });
  }

  /**
   * @returns {Promise<Discord.MessageEmbed>}
   */
  public async generateEmbed(): Promise<MessageEmbed> {
    throw new Error("This function must be overriden");
  }

  public async removeMessage() {
    return this.ec.db.guilds.get(this.ec.guild.id).then(async (dbGuild) => {
      // Delete the existing status message, if it exists
      if (!dbGuild || !dbGuild[this.guildProperty as keyof DbGuild]) {
        return;
      }

      return this.fetchMessage(dbGuild[this.guildProperty as keyof DbGuild] as string).then(
        async (message) => {
          if (!message) {
            return;
          }
          if (!message.deleted) {
            await message.delete();
          }
        }
      );
    });
  }

  public setMessage(messageId: string) {
    throw new Error("This function must be overriden");
  }

  public async fetchMessage(messageId: string) {
    let textChannels = this.ec.guild.channels.cache
      .filter((channel) => channel.type === "text" && !channel.deleted)
      .array() as Array<TextChannel>;

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
