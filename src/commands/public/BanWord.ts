import { CommandInteraction, TextChannel } from "discord.js";
import { listFormat, spoiler } from "../../utilities/Util";

import BanListService from "../../services/message/BanWordList.service";
import CensorshipService from "../../services/Censorship.service";
import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { IArgsProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class BanWord extends Command<IArgsProps> {
  public banWord: (interaction: CommandInteraction) => void;

  public constructor(
    private _censorshipService?: CensorshipService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "BanWord";
    this.instructions = "Add a word to the ban list";
    this.aliases = [this.name.toLowerCase(), "banwords"];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.BanWord,
        description: "Add word(s) to the banned word list",
        options: [
          {
            name: "words",
            description: "The word or words to ban",
            type: "STRING",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.banWord = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }

      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const content = interaction.options.getString("words");
      const args = CommandMessage.GetArgs(content ?? "");

      await interaction.deferReply();
      this.channel = new InteractionChannel(interaction);
      return this.runWithItem({ initiator, args });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute({ initiator, args: words }: IArgsProps): Promise<number | undefined> {
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      this.queueReply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    await this._censorshipService?.insertWords(initiator.guild, words);
    this.queueReply(
      `Banned words: ${spoiler(listFormat(words, "and", (text) => `"${text}"`))}` +
        "\nBan list will be updated shortly"
    );
    this._banListService?.update(initiator.guild);
    return 1;
  }
}
