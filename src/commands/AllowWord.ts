import BanListService from "../services/message/BanWordList.service";
import CensorshipService from "../services/Censorship.service";
import Command from "./Command";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import { GuildMember } from "discord.js";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class AllowWord extends Command {
  public constructor(
    private _censorService?: CensorshipService,
    private _banListService?: BanListService
  ) {
    super();
    this.instructions = "**AllowWord**\nRemove a word from the ban list";
    this.usage = "Usage: `AllowWord word1 word2 etc`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, words: string[]): Promise<void> {
    if (words.length === 0) {
      await this.sendHelpMessage();
      return;
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    await this._censorService
      ?.deleteWords(words)
      .then(() => this._banListService?.update())
      .then(() => this.reply("Banned words list has been updated"))
      .then(() => this.useItem(initiator, words.length));
  }
}
