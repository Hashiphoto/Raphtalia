import { CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ITransferProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import UserItem from "../../models/UserItem";
import ClientService from "../../services/Client.service";
import CurrencyService from "../../services/Currency.service";
import RoleContestService from "../../services/RoleContest.service";
import { Format, parseNumber, print } from "../../utilities/Util";
import Command from "../Command";

@autoInjectable()
export default class Give extends Command<ITransferProps> {
  public give: (interaction: CommandInteraction) => void;

  public constructor(
    @inject(delay(() => ClientService)) private _clientService?: ClientService,
    @inject(delay(() => RoleContestService)) private _roleContestService?: RoleContestService,
    @inject(delay(() => CurrencyService)) private currencyService?: CurrencyService
  ) {
    super();
    this.name = "Give";
    this.instructions =
      "Give the specified member(s) either an amount of money or an item. " +
      "If multiple members are listed, each member will be given the amount of money specified. " +
      "When giving an item, each member will be given one of that item. Only unused items can be given.";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Give,
        description: "Give a user money or an item",
        options: [
          {
            name: "user",
            description: "The gift recipient",
            type: "USER",
            required: true,
          },
          {
            name: "currency",
            description: "Dollar amount to give",
            type: "STRING",
          },
          {
            name: "item",
            description: "Name of an item to give",
            type: "STRING",
          },
        ],
      },
    ];

    // interaction callbacks
    this.give = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const targetUser = interaction.options.getUser("user", true);
      const currencyOption = interaction.options.getString("currency");
      const itemOption = interaction.options.getString("item");

      const target = await interaction.guild.members.fetch(targetUser.id);
      const amount = currencyOption ? parseNumber(currencyOption) : undefined;
      const item = itemOption
        ? await this.inventoryService?.findGuildItem(interaction.guild.id, itemOption)
        : undefined;

      this.channel = new InteractionChannel(interaction);
      return this.runWithItem({ initiator, targets: [target], amount, item });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member || !cmdMessage.message.guild) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    const amount = parseNumber(cmdMessage.parsedContent);
    const itemName = cmdMessage.parsedContent
      .substring(cmdMessage.parsedContent.lastIndexOf(">") + 1)
      .trim();

    const guildItem = await this.inventoryService?.findGuildItem(
      cmdMessage.message.guild.id,
      itemName
    );

    await this.runWithItem({
      initiator: cmdMessage.message.member,
      targets: cmdMessage.memberMentions,
      amount,
      item: guildItem,
    });
  }

  public async execute({
    initiator,
    targets,
    amount,
    item,
  }: ITransferProps): Promise<number | undefined> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }
    if (targets.length > 1) {
      return this.sendHelpMessage("You can only give to one user at a time");
    }
    if (!amount && !item) {
      return this.sendHelpMessage();
    }

    let response = "";

    if (amount) {
      response += await this.transferMoney(initiator, targets[0], amount);
    }
    if (item) {
      response += await this.transferItem(initiator, targets[0], item);
    }

    this.queueReply(response);
    return undefined;
  }

  protected async transferMoney(
    initiator: GuildMember,
    target: GuildMember,
    amount: number
  ): Promise<string> {
    if (amount < 0) {
      return "You cannot send a negative amount of money\n";
    }
    const balance = (await this.currencyService?.getCurrency(initiator)) as number;
    if (balance < amount) {
      return `You do not have enough money for that. Funds needed: ${print(amount, Format.Dollar)}`;
    }
    const raphtalia = this._clientService?.getRaphtaliaMember(initiator.guild);
    if (!raphtalia) {
      throw new RaphError(
        Result.NoGuild,
        `Raphtalia is not a member of the ${initiator.guild.name} server`
      );
    }
    await this.currencyService?.transferCurrency(initiator, target, amount);
    // Giving money to Raphtalia, presumably for a contest
    if (target.id === raphtalia.id && initiator.roles.hoist) {
      const existingContest = await this._roleContestService?.bidOnRoleContest(
        initiator.roles.hoist,
        initiator,
        amount
      );
      return existingContest
        ? `Paid ${print(amount, Format.Dollar)} towards contesting the ${
            initiator.guild.roles.cache.get(existingContest.roleId)?.name
          } role!`
        : `Thanks for the ${print(amount, Format.Dollar)}!`;
    } else {
      return `Transfered ${print(amount, Format.Dollar)} to ${target.displayName}!`;
    }
  }

  protected async transferItem(
    initiator: GuildMember,
    target: GuildMember,
    item: UserItem
  ): Promise<string> {
    const userItems = await this.inventoryService?.getUserItems(initiator, item);
    if (!userItems?.length) {
      return `${initiator.displayName} does not have any ${item.name} to give away`;
    }
    const userItem = userItems[0];
    await this.inventoryService?.transferItem(userItem, target);
    return `Transferred one ${item.name} to ${target.toString()}\n`;
  }
}
