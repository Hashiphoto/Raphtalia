import { CommandInteraction, TextChannel } from "discord.js";
import { Format, print } from "../../utilities/Util";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import CurrencyService from "../../services/Currency.service";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";

enum Args {
  SHOW,
}

@autoInjectable()
export default class Balance extends Command<ICommandProps> {
  public balance: (interaction: CommandInteraction) => void;

  public constructor(private _currencyService?: CurrencyService) {
    super();
    this.name = "Balance";
    this.instructions = "Get your current balance sent to you in a direct message";
    this.usage = "`Balance`";
    this.aliases = [this.name.toLowerCase(), "wallet"];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Balance,
        description: "Get your current balance",
        options: [
          {
            name: "show",
            description: "Post publicly in this channel. Default: False",
            type: "BOOLEAN",
          },
        ],
      },
    ];

    // interaction callbacks
    this.balance = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const show = interaction.options.getBoolean("show") || false;
      this.channel = new InteractionChannel(interaction, !show);
      this.runWithItem({ initiator });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    const initiator = cmdMessage.message.member;
    const show = cmdMessage.args.length > 0 && cmdMessage.args[Args.SHOW] === "show";
    if (!show) {
      const dmChannel = await initiator.createDM();
      this.channel = dmChannel;
    } else {
      this.channel = cmdMessage.message.channel as TextChannel;
    }

    await this.runWithItem({ initiator });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    const balance = (await this._currencyService?.getCurrency(initiator)) as number;
    const messageText = `You have ${print(balance, Format.Dollar)} in ${initiator.guild.name}`;

    this.reply(messageText);
    return 1;
  }
}
