import { Guild as DsGuild, MessageEmbed } from "discord.js";
import { inject, injectable } from "tsyringe";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";
import { listFormat } from "../Util";
import EmbedMessageService from "./EmbedMessage.service";

@injectable()
export default class BanListService extends EmbedMessageService {
  public constructor(
    protected guild: DsGuild,
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService
  ) {
    super(guild, guildService, channelService, censorshipService);

    this.guildProperty = "banListMessageId";
  }

  protected async setMessage(messageId: string): Promise<void> {
    await this.guildService.setBanListMessage(this.guild.id, messageId);
  }

  protected async generateEmbed(): Promise<MessageEmbed> {
    const enabled = await this.censorshipService.censorshipEnabled();
    const words = await this.censorshipService.getAllBannedWords();
    const statusEmbed = new MessageEmbed()
      .setColor(enabled ? 0xf54c38 : 0x471d18)
      .setTitle(`Banned Words | Censorship is ${enabled ? "Enabled" : "Disabled"}`)
      .setTimestamp(new Date())
      .setDescription(listFormat(words, ""))
      .setThumbnail("https://i.imgur.com/tnMtgLT.png");

    return statusEmbed;
  }
}
