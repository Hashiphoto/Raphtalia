import { TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import ChannelRepository from "../repositories/Channel.repository";

@injectable()
export default class ChannelService {
  public constructor(@inject(ChannelRepository) private _channelsRepo: ChannelRepository) {}
  /**
   * A negative number means deletion is off.
   * A zero or greater means messages will be deleted.
   */
  public setAutoDelete(deleteDelay: number) {
    return this._channelsRepo.setAutoDelete(this.ec.channel.id, deleteDelay);
  }

  public async fetchMessage(messageId: string) {
    const textChannels = this.ec.guild.channels.cache
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

  /**
   * Adds the "watchSend" method to the channel to send messages and delete them
   * after a delay (set in the channel's db entry)=
   */
  getDeleteTime(channel: TextChannel) {
    return this.db.channels.get(channel.id).then((dbChannel) => {
      let deleteTime = -1;
      if (dbChannel && dbChannel.delete_ms >= 0) {
        deleteTime = dbChannel.delete_ms;
      }

      return deleteTime;
    });
  }
}
