import Discord, { EmbedFieldData } from "discord.js";

import ExecutionContext from "../../models/ExecutionContext";
import SingletonMessageController from "./SingletonMessageController";

export default class StoreStatusController extends SingletonMessageController {
  public constructor(context: ExecutionContext) {
    super(context);
    this.guildProperty = "storeMessageId";
  }

  public async generateEmbed() {
    const storeFields = await this.getStoreFields();
    const statusEmbed = new Discord.MessageEmbed()
      .setColor(0xe3c91e)
      .setTitle("Store")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/b8xakAL.png")
      .addFields(storeFields);

    return statusEmbed;
  }

  public setMessage(messageId: string) {
    return this.ec.db.guilds.setStoreMessage(this.ec.guild.id, messageId);
  }

  private async getStoreFields() {
    const fields = new Array<EmbedFieldData>();

    const items = await this.ec.db.inventory.getGuildStock(this.ec.guild.id);

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
