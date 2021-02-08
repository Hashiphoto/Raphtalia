import Controller from "./Controller";
import { TextChannel } from "discord.js";

export default class ChannelController extends Controller {
  /**
   * A negative number means deletion is off.
   * A zero or greater means messages will be deleted.
   */
  public setAutoDelete(deleteDelay: number) {
    return this.ec.db.channels.setAutoDelete(this.ec.channel.id, deleteDelay);
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
