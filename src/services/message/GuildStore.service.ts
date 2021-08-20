import { EmbedFieldData, Guild as DsGuild, MessageEmbed } from "discord.js";
import { inject, injectable } from "tsyringe";
import GuildInventoryRepository from "../../repositories/GuildInventory.repository";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";
import EmbedMessageManager from "./EmbedMessage.service";

@injectable()
export default class GuildStoreService extends EmbedMessageManager {
  public constructor(
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService,
    @inject(GuildInventoryRepository) private _guildInventoryRepo: GuildInventoryRepository
  ) {
    super(guildService, channelService, censorshipService);

    this.guildProperty = "storeMessageId";
  }

  protected async setMessage(guildId: string, messageId: string): Promise<void> {
    await this.guildService.setStoreMessage(guildId, messageId);
  }

  protected async generateEmbed(guild: DsGuild): Promise<MessageEmbed> {
    const storeFields = await this.getStoreFields(guild.id);
    const statusEmbed = new MessageEmbed()
      .setColor(0xe3c91e)
      .setTitle("Store")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/b8xakAL.png")
      .addFields(storeFields);

    return statusEmbed;
  }

  private async getStoreFields(guildId: string) {
    const fields: EmbedFieldData[] = [];

    const items = await this._guildInventoryRepo.getGuildStock(guildId);

    const itemFields = items.map((item) => {
      return {
        name: item.getFormattedName(),
        value: item.getDetails(),
        inline: true,
      };
    });

    return fields.concat(itemFields);
  }
}
