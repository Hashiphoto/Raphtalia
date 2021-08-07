import { Guild as DsGuild, Message, MessageEmbed, TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import { Result } from "../../enums/Result";
import Guild from "../../models/Guild";
import RaphError from "../../models/RaphError";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";

@injectable()
export default class EmbedMessageService {
  protected guildProperty: string;

  public constructor(
    protected guild: DsGuild,
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService
  ) {
    this.guildProperty = "";
  }

  /**
   * Update the existing embed message
   */
  public async update(): Promise<void> {
    const statusEmbed = await this.generateEmbed();
    const dbGuild = await this.guildService.getGuild(this.guild.id);

    // Exit if no message to update
    if (!dbGuild || !dbGuild[this.guildProperty as keyof Guild]) {
      return;
    }

    // Update the status message, if it exists
    const statusMessage = await this.channelService.fetchMessage(
      dbGuild[this.guildProperty as keyof Guild] as string
    );
    if (statusMessage) {
      await statusMessage.edit({ embed: statusEmbed });
    }
  }

  /**
   * Delete the existing embed message
   */
  public async removeMessage(): Promise<void> {
    const dbGuild = await this.guildService.getGuild(this.guild.id);
    if (!dbGuild || !dbGuild[this.guildProperty as keyof Guild]) {
      return;
    }

    const statusMessage = await this.channelService.fetchMessage(
      dbGuild[this.guildProperty as keyof Guild] as string
    );
    if (!statusMessage) {
      return;
    }
    await statusMessage.delete().catch((error) => {
      console.log(`Could not delete message ${statusMessage.id}: ${error.name}`);
    });
  }

  /**
   * Generate a new embed and post it to the given channel
   */
  public async postEmbed(channel: TextChannel): Promise<Message> {
    const embed = await this.generateEmbed();
    const message = await channel.send({ embed });

    await message.pin();
    await this.setMessage(message.id);

    return message;
  }

  /**
   * Create the embed to post
   */
  protected async generateEmbed(): Promise<MessageEmbed> {
    throw new RaphError(Result.ProgrammingError);
  }

  /**
   * Update the embed message in the guild
   */
  protected async setMessage(messageId: string): Promise<void> {
    throw new RaphError(Result.ProgrammingError);
  }
}
