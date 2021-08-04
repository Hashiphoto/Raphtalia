import Discord from "discord.js";
import ExecutionContext from "../../models/ExecutionContext";
import SingletonMessageController from "./SingletonMessageController";
import Util from "../../Util";

export default class BanListStatusController extends SingletonMessageController {
  public constructor(context: ExecutionContext) {
    super(context);
    this.guildProperty = "banListMessageId";
  }

  public async generateEmbed() {
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

  public setMessage(messageId: string) {
    return this.ec.db.guilds.setBanListMessage(this.ec.guild.id, messageId);
  }
}
