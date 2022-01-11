import { CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ITargettedProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import GuildItem from "../../models/GuildItem";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import ClientService from "../../services/Client.service";
import CurrencyService from "../../services/Currency.service";
import { Dice, roll } from "../../utilities/Rng";
import { Format, print } from "../../utilities/Util";
import Command from "../Command";

interface IStealProps extends ITargettedProps {
  itemName: string;
}

@autoInjectable()
export default class Steal extends Command<IStealProps> {
  public steal: (interaction: CommandInteraction) => void;

  public constructor(
    @inject(CurrencyService) private _currencyService?: CurrencyService,
    @inject(delay(() => ClientService)) private _clientService?: ClientService
  ) {
    super();
    this.name = "Steal";
    this.instructions =
      "Attempt to take an item from another user. " +
      "Odds of success are 1/20, or 2/20 if the user has had the item for more than 3 days. Cost of steal attempt = `odds * item price * 110%`";
    this.usage = "`Steal @member (item name)`";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Steal,
        description: "Attempt to steal an item from another user",
        options: [
          {
            name: "user",
            description: "The user to steal from",
            type: "USER",
            required: true,
          },
          {
            name: "item",
            description: "The name of the item to steal",
            type: "STRING",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.steal = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }

      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const targetUser = interaction.options.getUser("user", true);
      const target = await interaction.guild?.members.fetch(targetUser);
      if (!target) {
        return interaction.reply(`No user was specified or they are not members of the server`);
      }
      this.channel = new InteractionChannel(interaction);
      const itemName = interaction.options.getString("item", true);
      return this.runWithItem({ initiator, targets: [target], itemName });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member || !cmdMessage.message.guild) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    const itemName = cmdMessage.parsedContent
      .substring(cmdMessage.parsedContent.lastIndexOf(">") + 1)
      .trim();

    if (cmdMessage.memberMentions.length === 0) {
      await this.sendHelpMessage();
      return;
    }
    if (cmdMessage.memberMentions.length > 1) {
      await this.sendHelpMessage(`You can only attempt to steal from one person at a time`);
      return;
    }
    const target = cmdMessage.memberMentions[0];

    await this.runWithItem({ initiator: cmdMessage.message.member, targets: [target], itemName });
  }

  public async execute({ initiator, targets, itemName }: IStealProps): Promise<number | undefined> {
    if (!targets.length) {
      this.sendHelpMessage(`Please specify one user to steal from`);
      return;
    }

    const target = targets[0];
    const raphtalia = this._clientService?.getRaphtaliaMember(initiator.guild) as GuildMember;

    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this.inventoryService?.findGuildItem(target.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        await this.reply(`There is more than one item with that name. Matches: ${error.message}`);
        return;
      }
    }
    if (!guildItem) {
      this.reply(`Item "${itemName}" does not exist`);
      return;
    }

    const userItem = await this.inventoryService?.findUserItem(target, guildItem.name);
    if (!userItem) {
      this.reply(`${target.displayName} does not have any ${guildItem.printName()} to steal`);
      return;
    }
    if (userItem.isStealProtected) {
      return this.sendHelpMessage(`${userItem.printName()} cannot be stolen.`);
    }

    const dc = userItem.stealDc;
    const odds = (Dice.D20 - dc + 1) / Dice.D20; // The odds of making a successful steal
    const cost = userItem.price * 1.1 * odds; // Steal costs 10% more than the percentage of the odds of the guild price

    await this._currencyService?.transferCurrency(initiator, raphtalia, cost);

    let response = "";
    const dieResult = roll(Dice.D20);

    if (dieResult.against(dc)) {
      await this.inventoryService?.transferItem(userItem, target, initiator);
      response +=
        `**${userItem.name} successfully stolen!** ` +
        `Transferred one ${userItem.printName()} from ${target.displayName} to ${
          initiator.displayName
        }\n`;
    } else {
      response +=
        `**Steal attempt failed!** ` +
        `Could not steal a ${userItem.printName()} from ${target.displayName}\n`;
    }

    response +=
      `Rolled a \`<${dieResult.result}>\` against \`${dc}\`\n` +
      `*Charged ${print(cost, Format.Dollar)} for this attempt*`;
    await this.reply(response);

    return 1;
  }
}
