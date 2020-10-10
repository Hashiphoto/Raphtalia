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
    const censorCtlr = new CensorController(this.db, this.guild);
    const enabled = await censorCtlr.censorshipEnabled();
    const words = await censorCtlr.getAllBannedWords();
    const statusEmbed = {
      color: enabled ? 0xf54c38 : 0x471d18,
      title: `Banned Words | Censorship is ${enabled ? "Enabled" : "Disabled"}`,
      timestamp: new Date(),
      description: Format.listFormat(words, ""),
      thumbnail: { url: "https://i.imgur.com/tnMtgLT.png" },
    };

    return statusEmbed;
  }

  setMessage(messageId) {
    return this.db.guilds.setBanListMessage(this.guild.id, messageId);
  }
}

export default BanListStatusController;
