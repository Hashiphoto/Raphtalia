import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import CensorshipService from "../services/Censorship.service";
import BanListService from "../services/message/BanWordList.service";
import Command from "./Command";

@autoInjectable()
export default class AllowWord extends Command {
  public constructor(
    private _censorshipService?: CensorshipService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "AllowWord";
    this.instructions = "Remove a word from the ban list";
    this.usage = "`AllowWord word1 word2 etc`";
    this.aliases = [this.name.toLowerCase(), "allowwords"];
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

    await this._censorshipService
      ?.deleteWords(initiator.guild, words)
      .then(() => this._banListService?.update(initiator.guild))
      .then(() => this.reply("Banned words list has been updated"));

    return words.length;
  }
}
