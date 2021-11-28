import BanListService from "../services/message/BanWordList.service";
import CensorshipService from "../services/Censorship.service";
import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { IArgsProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { listFormat } from "../utilities/Util";

@autoInjectable()
export default class BanWord extends Command<IArgsProps> {
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

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute({ initiator, args }: IArgsProps): Promise<number | undefined> {
    if (args.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && args.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${args.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    await this._censorshipService?.insertWords(initiator.guild, args);
    await this.reply(`Banned words: ${listFormat(args)}` + "Ban list will be updated shortly");
    this._banListService?.update(initiator.guild);
    return 1;
  }
}
