import {
  DMChannel,
  Guild as DsGuild,
  GuildMember,
  Message,
  MessageOptions,
  StringResolvable,
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
    const textChannels = guild.channels.cache
      .filter((channel) => channel.type === "text" && !channel.deleted)
      .array() as TextChannel[];

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
  public async getDeleteTime(channel: TextChannel | DMChannel): Promise<number> {
    return this._channelRepo.get(channel.id).then((dbChannel) => {
      let deleteTime = -1;
      if (dbChannel && dbChannel.delete_ms >= 0) {
        deleteTime = dbChannel.delete_ms;
      }

      return deleteTime;
    });
  }

  public async watchSend(
    channel: TextChannel | DMChannel,
    content: StringResolvable,
    options?: MessageOptions
  ): Promise<Message> {
    const message = (
      options ? await channel.send(content, options) : await channel.send(content)
    ) as Message;
    const deleteTime = await this.getDeleteTime(channel);

    if (deleteTime >= 0) {
      message.delete({ timeout: deleteTime });
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
    return this.watchSend(channel, text)
      .then(() => {
        return channel.awaitMessages(filter, {
          max: 1,
          time: question.timeout,
          errors: ["time"],
        });
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
