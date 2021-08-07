import { EmbedFieldData, Guild as DsGuild, MessageEmbed } from "discord.js";
import { inject, injectable } from "tsyringe";
import GuildInventoryRepository from "../../repositories/GuildInventory.repository";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";
import EmbedMessageService from "./EmbedMessage.service";

@injectable()
export default class GuildStoreService extends EmbedMessageService {
  public constructor(
    protected guild: DsGuild,
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService,
    @inject(GuildInventoryRepository) private _guildInventoryRepo: GuildInventoryRepository
  ) {
    super(guild, guildService, channelService, censorshipService);

    this.guildProperty = "storeMessageId";
  }

  protected async setMessage(messageId: string): Promise<void> {
    await this.guildService.setStoreMessage(this.guild.id, messageId);
  }

  protected async generateEmbed(): Promise<MessageEmbed> {
    const storeFields = await this.getStoreFields();
    const statusEmbed = new MessageEmbed()
      .setColor(0xe3c91e)
      .setTitle("Store")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/b8xakAL.png")
      .addFields(storeFields);

    return statusEmbed;
  }

  private async getStoreFields() {
    const fields = new Array<EmbedFieldData>();

    const items = await this._guildInventoryRepo.getGuildStock(this.guild.id);

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
