import { Guild as DsGuild, Message, TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import ChannelRepository from "../repositories/Channel.repository";

@injectable()
export default class ChannelService {
  private _guild: DsGuild;

  public constructor(@inject(ChannelRepository) private _channelRepo: ChannelRepository) {}

  public set guild(guild: DsGuild) {
    this._guild = guild;
  }

  /**
   * A negative number means deletion is off.
   * A zero or greater means messages will be deleted.
   */
  public async setAutoDelete(channelId: string, deleteDelay: number): Promise<void> {
    await this._channelRepo.setAutoDelete(channelId, deleteDelay);
  }

  /**
   * Check every channel for the message id
   */
  public async fetchMessage(messageId: string): Promise<Message | undefined> {
    const textChannels = this._guild.channels.cache
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
  public async getDeleteTime(channel: TextChannel): Promise<number> {
    return this._channelRepo.get(channel.id).then((dbChannel) => {
      let deleteTime = -1;
      if (dbChannel && dbChannel.delete_ms >= 0) {
        deleteTime = dbChannel.delete_ms;
      }

      return deleteTime;
    });
  }

  public async watchSend(channel: TextChannel, ...content: any[]): Promise<Message> {
    const message = await channel.send([...content]);
    const deleteTime = await this.getDeleteTime(channel);

    if (deleteTime >= 0) {
      message.delete({ timeout: deleteTime });
    }
    return message;
  }
}
