import { CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { IArgProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import GuildItem from "../../models/GuildItem";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import UserItem from "../../models/UserItem";
import ClientService from "../../services/Client.service";
import CurrencyService from "../../services/Currency.service";
import { Dice, roll } from "../../utilities/Rng";
import { Format, print } from "../../utilities/Util";
import Command from "../Command";

const percentCost = 0.05;

@autoInjectable()
export default class Scan extends Command<IArgProps> {
  public scan: (interaction: CommandInteraction) => void;

  public constructor(
    @inject(CurrencyService) private _currencyService?: CurrencyService,
    @inject(delay(() => ClientService)) private _clientService?: ClientService
  ) {
    super();
    this.name = "Scan";
    this.instructions = `Search other users' inventories for a specified item. Costs ${print(
      percentCost,
      Format.Percent
    )} of the item's store price. DC10 to reveal the user's name`;
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Scan,
        description: `Search others' inventories for an item`,
        options: [
          {
            name: "item",
            description: "The name of the item to scan for",
            type: "STRING",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.scan = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }

      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      this.channel = new InteractionChannel(interaction);
      const itemName = interaction.options.getString("item", true);
      return this.runWithItem({ initiator, arg: itemName });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage();
      return;
    }
    await this.runWithItem({ initiator: cmdMessage.message.member, arg: cmdMessage.parsedContent });
  }

  public async execute({ initiator, arg: itemName }: IArgProps): Promise<number | undefined> {
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this.inventoryService?.findGuildItem(initiator.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        this.queueReply(`There is more than one item with that name. Matches: ${error.message}`);
        return;
      }
      throw error;
    }
    if (!guildItem) {
      this.queueReply(`There are no items named "${itemName}"`);
      return;
    }

    // TODO: Simplify code with Steal
    const initiatorBalance = await this._currencyService?.getCurrency(initiator);
    const cost = guildItem.price * percentCost;
    if (!initiatorBalance || initiatorBalance < cost) {
      this.queueReply(
        `${
          initiator.displayName
        } does not have enough money. Scanning for a ${guildItem.printName()} costs ${print(
          cost,
          Format.Dollar
        )} (${print(percentCost, Format.Percent)} of the store price)`
      );
      return;
    }

    await this._currencyService?.transferCurrency(
      initiator,
      this._clientService?.getRaphtaliaMember(initiator.guild) as GuildMember,
      cost
    );

    const usersWithItem = (
      (await this.inventoryService?.findUsersWithItem(guildItem)) as UserItem[]
    ).filter((item) => item.userId !== initiator.user.id);
    const members = await initiator.guild.members.fetch({
      user: usersWithItem.map((ui) => ui.userId),
      force: true,
    });

    let deciphered = 0;
    const memberNames = members.reduce((sum, member) => {
      if (roll(Dice.D20).against(10)) {
        deciphered++;
        return sum + `\t- ${member.displayName}\n`;
      }
      return sum + "\t- ~~unknown~~\n";
    }, "");

    let response = `Deciphered ${deciphered}/${
      members.size
    } members with a ${guildItem.printName()}:\n${memberNames}`;

    response += `*Charged ${print(cost, Format.Dollar)} for this scan*`;

    this.queueReply(response);
    return 1;
  }
}
