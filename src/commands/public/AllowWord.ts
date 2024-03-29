import { CommandInteraction, TextChannel } from "discord.js";

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
import { listFormat } from "../../utilities/Util";

@autoInjectable()
export default class AllowWord extends Command<IArgsProps> {
  public allowWord: (interaction: CommandInteraction) => void;

  public constructor(
    private _censorshipService?: CensorshipService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "AllowWord";
    this.instructions = "Remove word(s) from the ban list";
    this.aliases = [this.name.toLowerCase(), "allowwords"];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.AllowWord,
        description: "Remove word(s) from the banned word list",
        options: [
          {
            name: "words",
            description: "The word or words to allow",
            type: "STRING",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.allowWord = async (interaction: CommandInteraction) => {
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
      await this.sendHelpMessage();
      return;
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      this.queueReply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    await this._censorshipService?.deleteWords(initiator.guild, words);
    this.queueReply(
      `Allowed words: ${listFormat(words, "and", (text) => `"${text}"`)}` +
        "\nBan list will be updated shortly"
    );
    this._banListService?.update(initiator.guild);

    return words.length;
  }
}
