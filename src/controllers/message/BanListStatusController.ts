import CensorController from "../CensorController.js";
import Discord from "discord.js";
import ExecutionContext from "../../structures/ExecutionContext.js";
import SingletonMessageController from "./SingletonMessageController.js";
import Util from "../../Util.js";

export default class BanListStatusController extends SingletonMessageController {
  constructor(context: ExecutionContext) {
    super(context);
    this.guildProperty = "banListMessageId";
  }

  /**
   * @returns {Promise<Discord.MessageEmbed>}
   */
  async generateEmbed() {
    const enabled = await this.ec.censorController.censorshipEnabled();
    const words = await this.ec.censorController.getAllBannedWords();
    const statusEmbed = new Discord.MessageEmbed()
      .setColor(enabled ? 0xf54c38 : 0x471d18)
      .setTitle(`Banned Words | Censorship is ${enabled ? "Enabled" : "Disabled"}`)
      .setTimestamp(new Date())
      .setDescription(Util.listFormat(words, ""))
      .setThumbnail("https://i.imgur.com/tnMtgLT.png");

    return statusEmbed;
  }

  setMessage(messageId: string) {
    return this.db.guilds.setBanListMessage(this.guild.id, messageId);
  }
}
