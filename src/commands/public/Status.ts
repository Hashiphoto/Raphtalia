import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import CurrencyService from "../../services/Currency.service";
import MemberService from "../../services/Member.service";
import { Format, print } from "../../utilities/Util";
import Command from "../Command";

enum Args {
  SHOW,
}

interface IStatusProps extends ICommandProps {
  show?: boolean;
}

@autoInjectable()
export default class Status extends Command<IStatusProps> {
  public status: (interaction: CommandInteraction) => void;

  public constructor(
    @inject(delay(() => CurrencyService)) private _currencyService?: CurrencyService,
    @inject(delay(() => MemberService)) private _memberService?: MemberService
  ) {
    super();
    this.name = "Status";
    this.instructions = "Get your current balance and inventory";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Status,
        description: "Get your balance and inventory",
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
    this.status = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      await interaction.deferReply();
      const show = interaction.options.getBoolean("show") ?? false;
      this.channel = new InteractionChannel(interaction, !show);
      return this.runWithItem({ initiator });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    const initiator = cmdMessage.message.member;
    if (!initiator) {
      throw new RaphError(Result.NoGuild);
    }
    const show = cmdMessage.args.length > 0 && cmdMessage.args[Args.SHOW].toLowerCase() === "show";
    this.channel = show ? cmdMessage.message.channel : await initiator.createDM();

    await this.runWithItem({
      initiator,
    });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    const { content, embed } = await this.generateMessage(initiator);
    this.reply(content, { embeds: [embed] });
    return undefined;
  }

  private async generateMessage(initiator: GuildMember) {
    const balanceMessage = await this._currencyService?.getCurrency(initiator).then((balance) => {
      return `**Balance**: ${print(balance, Format.Dollar)}\n`;
    });

    const infractionMessage = await this._memberService
      ?.getInfractions(initiator)
      .then((infractions) => {
        return `**Infractions**: ${infractions}\n`;
      });

    const embed = (await this.inventoryService
      ?.getUserInventory(initiator)
      .then((userInventory) => {
        return userInventory.toEmbed();
      })) as MessageEmbed;

    const content = `${balanceMessage}${infractionMessage}`;

    return { content, embed };
  }
}
