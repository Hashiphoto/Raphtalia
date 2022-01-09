import { CommandInteraction, GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
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
    this.usage = "`Status`";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Status,
        description: "Get your balance and inventory",
        options: [
          {
            name: "show",
            description: "Post publicly in this channel instead of a DM. Default: False",
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
      const show = interaction.options.getBoolean("show");
      this.channel = interaction.channel as TextChannel;
      this.runWithItem({ initiator, show: show ?? undefined });
      return interaction.reply({
        content: show ? "Showing status publicly" : "Status sent in a DM",
        ephemeral: true,
      });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    await this.runWithItem({
      initiator: cmdMessage.message.member,
      show: cmdMessage.args.length > 0 && cmdMessage.args[Args.SHOW].toLowerCase() === "show",
    });
  }

  public async execute({ initiator, show }: IStatusProps): Promise<number | undefined> {
    const { content, embed } = await this.generateMessage(initiator);

    if (show) {
      await this.reply(content, { embeds: [embed] });
    } else {
      const dmChannel = await initiator.createDM();
      await dmChannel.send({ content, embeds: [embed] });
    }
    return 1;
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
