import ExecutionContext from "../../models/ExecutionContext";
import Guild from "../../models/Guild";
import GuildBasedController from "../Controller";
import { MessageEmbed } from "discord.js";

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
      if (!dbGuild || !dbGuild[this.guildProperty as keyof Guild]) {
        return;
      }

      return this.ec.channelController
        .fetchMessage(dbGuild[this.guildProperty as keyof Guild] as string)
        .then((message) => message && message.edit({ embed: statusEmbed }));
    });
  }

  public async generateEmbed(): Promise<MessageEmbed> {
    throw new Error("This function must be overriden");
  }

  public async removeMessage() {
    return this.ec.db.guilds.get(this.ec.guild.id).then(async (dbGuild) => {
      // Delete the existing status message, if it exists
      if (!dbGuild || !dbGuild[this.guildProperty as keyof Guild]) {
        return;
      }

      return this.ec.channelController
        .fetchMessage(dbGuild[this.guildProperty as keyof Guild] as string)
        .then(async (message) => {
          if (!message) {
            return;
          }
          await message.delete().catch((error) => {
            console.log(`Could not delete message ${message.id}: ${error.name}`);
          });
        });
    });
  }

  public setMessage(messageId: string) {
    throw new Error("This function must be overriden");
  }
}
