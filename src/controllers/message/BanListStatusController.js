import Discord from "discord.js";
import Format from "../../Format.js";
import CensorController from "../CensorController.js";

import SingletonMessageController from "./SingletonMessageController.js";

class BanListStatusController extends SingletonMessageController {
  /**
   * @param {Database} db
   * @param {Discord.Guild} guild
   */
  constructor(db, guild) {
    super(db, guild);
    this.guildProperty = "banListMessageId";
  }

  /**
   * @returns {Promise<Discord.RichEmbed>}
   */
  async generateEmbed() {
    const words = await new CensorController(this.db, this.guild).getAllBannedWords();
    const statusEmbed = {
      color: 0x73f094,
      title: "Banned Words",
      timestamp: new Date(),
      description: Format.listFormat(words, ""),
      thumbnail: { url: this.guild.iconURL },
    };

    return statusEmbed;
  }

  setMessage(messageId) {
    return this.db.guilds.setBanListMessage(this.guild.id, messageId);
  }
}

export default BanListStatusController;
