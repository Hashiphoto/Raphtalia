import delay from "delay";
import {
  DMChannel,
  Guild as DsGuild,
  GuildMember,
  Message,
  MessageOptions,
  PartialTextBasedChannelFields,
  TextBasedChannels,
  TextChannel,
} from "discord.js";
import { inject, injectable } from "tsyringe";
import Question from "../models/Question";
import ChannelRepository from "../repositories/Channel.repository";

@injectable()
export default class ChannelService {
  public constructor(@inject(ChannelRepository) private _channelRepo: ChannelRepository) {}

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
  public async fetchMessage(guild: DsGuild, messageId: string): Promise<Message | undefined> {
    const textChannels = guild.channels.cache.filter(
      (channel) => channel.isText() && !channel.deleted
    );

    for (const [, channel] of textChannels) {
      try {
        const message = await (channel as TextBasedChannels).messages.fetch(messageId);
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
   * after a delay (set in the channel's db entry)
   */
  public async getDeleteTime(channel: PartialTextBasedChannelFields): Promise<number> {
    const id = (channel as TextChannel)?.id;
    if (id) {
      return this._channelRepo.get(id).then((dbChannel) => {
        let deleteTime = -1;
        if (dbChannel && dbChannel.delete_ms >= 0) {
          deleteTime = dbChannel.delete_ms;
        }

        return deleteTime;
      });
    }

    return -1;
  }

  public async watchSend(
    channel: PartialTextBasedChannelFields,
    options: MessageOptions
  ): Promise<Message> {
    const message = await channel.send(options);
    const deleteTime = await this.getDeleteTime(channel);

    if (deleteTime >= 0) {
      delay(deleteTime).then(() => message.delete());
    }
    return message;
  }

  public async sendTimedMessage(
    channel: TextChannel | DMChannel,
    member: GuildMember,
    question: Question,
    showDuration = true
  ): Promise<Message | undefined> {
    const text = this.formatText(member, question, showDuration);
    const re = new RegExp(question.answer ?? ".*", "gi");
    const filter = (message: Message) =>
      message.content.match(re) != null && message.author.id === member.id;
    return this.watchSend(channel, { content: text })
      .then(() => {
        return channel.awaitMessages({ filter, max: 1, time: question.timeout, errors: ["time"] });
      })
      .then((collected) => {
        return collected.first();
      });
  }

  private formatText(member: GuildMember, question: Question, showDuration: boolean) {
    let text = `${member.toString()} `;
    if (showDuration && question.timeout) {
      text += `\`(${question.timeout / 1000}s)\`\n`;
    }
    text += question.prompt;
    return text;
  }
}
