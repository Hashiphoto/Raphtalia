import { Guild as DsGuild, MessageEmbed } from "discord.js";
import { inject, injectable } from "tsyringe";
import { listFormat } from "../../utilities/Util";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";
import EmbedMessageManager from "./EmbedMessage.service";

@injectable()
export default class BanListService extends EmbedMessageManager {
  public constructor(
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService
  ) {
    super(guildService, channelService, censorshipService);

    this.guildProperty = "banListMessageId";
  }

  protected async setMessage(guildId: string, messageId: string): Promise<void> {
    await this.guildService.setBanListMessage(guildId, messageId);
  }

  protected async generateEmbed(guild: DsGuild): Promise<MessageEmbed> {
    const enabled = await this.censorshipService.isCensorshipEnabled(guild);
    const words = await this.censorshipService.getAllBannedWords(guild);
    const statusEmbed = new MessageEmbed()
      .setColor(enabled ? 0xf54c38 : 0x471d18)
      .setTitle(`Banned Words | Censorship is ${enabled ? "Enabled" : "Disabled"}`)
      .setTimestamp(new Date())
      .setDescription(listFormat(words, ""))
      .setThumbnail("https://i.imgur.com/tnMtgLT.png");

    return statusEmbed;
  }
}
