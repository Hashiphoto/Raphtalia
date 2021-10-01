import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import CensorshipService from "../services/Censorship.service";
import BanListService from "../services/message/BanWordList.service";
import { listFormat } from "../utilities/Util";
import Command from "./Command";

@autoInjectable()
export default class BanWord extends Command {
  public constructor(
    private _censorshipService?: CensorshipService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "BanWord";
    this.instructions = "Add a word to the ban list";
    this.usage = "`BanWord word1 word2 etc1`";
    this.aliases = [this.name.toLowerCase(), "banwords"];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, words: string[]): Promise<number | undefined> {
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    await this._censorshipService?.insertWords(initiator.guild, words);
    await this.reply(`Banned words: ${listFormat(words)}` + "Ban list will be updated shortly");
    this._banListService?.update(initiator.guild);
    return 1;
  }
}
