import { GuildMember, TextChannel } from "discord.js";

import BanListService from "../services/message/BanWordList.service";
import CensorshipService from "../services/Censorship.service";
import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import { listFormat } from "../utilities/Util";

@autoInjectable()
export default class BanWord extends Command {
  public constructor(
    private _censorshipService?: CensorshipService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "BanWord";
    this.instructions = "**BanWord**\nAdd a word to the ban list";
    this.usage = "Usage: `BanWord word1 word2 etc1`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, words: string[]): Promise<any> {
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      return this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    await this._censorshipService?.insertWords(initiator.guild, words);
    await this.useItem(initiator);
    await this.reply(`Banned words: ${listFormat(words)}` + "Ban list will be updated shortly");
    this._banListService?.update(initiator.guild);
  }
}
