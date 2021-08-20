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
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService
  ) {
    this.guildProperty = "";
  }

  /**
   * Update the existing embed message
   */
  public async update(guild: DsGuild): Promise<void> {
    const statusEmbed = await this.generateEmbed(guild);
    const dbGuild = await this.guildService.getGuild(guild.id);

    // Exit if no message to update
    if (!dbGuild || !dbGuild[this.guildProperty as keyof Guild]) {
      return;
    }

    // Update the status message, if it exists
    const statusMessage = await this.channelService.fetchMessage(
      guild,
      dbGuild[this.guildProperty as keyof Guild] as string
    );
    if (statusMessage) {
      await statusMessage.edit({ embed: statusEmbed });
    }
  }

  /**
   * Delete the existing embed message
   */
  public async removeMessage(guild: DsGuild): Promise<void> {
    const dbGuild = await this.guildService.getGuild(guild.id);
    if (!dbGuild || !dbGuild[this.guildProperty as keyof Guild]) {
      return;
    }

    const statusMessage = await this.channelService.fetchMessage(
      guild,
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
    const embed = await this.generateEmbed(channel.guild);
    const message = await channel.send({ embed });

    await message.pin();
    await this.setMessage(channel.guild.id, message.id);

    return message;
  }

  /**
   * Create the embed to post
   */
  protected async generateEmbed(guild: DsGuild): Promise<MessageEmbed> {
    throw new RaphError(Result.ProgrammingError);
  }

  /**
   * Update the embed message in the guild
   */
  protected async setMessage(guildId: string, messageId: string): Promise<void> {
    throw new RaphError(Result.ProgrammingError);
  }
}
