import { CommandInteraction, GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ITransferProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import InteractionChannel from "../../models/InteractionChannel";
import Item from "../../models/Item";
import RaphError from "../../models/RaphError";
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
    this.usage = "`Give @member ($1|item name)`";
    this.aliases = [this.name.toLowerCase()];

    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Give,
        description: "Remove word(s) from the banned word list",
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
      this.runWithItem({ initiator, targets: [target], amount, item }).catch(() =>
        interaction.reply({ content: "Something went wrong", ephemeral: true })
      );
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

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    if (!amount && !item) {
      return this.sendHelpMessage();
    }

    let response = "";

    if (amount) {
      response += await this.transferMoney(initiator, targets, amount);
    }
    if (item) {
      response += await this.transferItem(initiator, targets, item);
    }

    await this.reply(response);
    return targets.length;
  }

  protected async transferMoney(
    initiator: GuildMember,
    targets: GuildMember[],
    amount: number
  ): Promise<string> {
    if (amount < 0) {
      return "You cannot send a negative amount of money\n";
    }
    const totalAmount = amount * targets.length;
    const balance = (await this.currencyService?.getCurrency(initiator)) as number;
    if (balance < totalAmount) {
      return `You do not have enough money for that. Funds needed: ${print(
        totalAmount,
        Format.Dollar
      )}`;
    }
    const raphtalia = this._clientService?.getRaphtaliaMember(initiator.guild);
    if (!raphtalia) {
      throw new RaphError(
        Result.NoGuild,
        `Raphtalia is not a member of the ${initiator.guild.name} server`
      );
    }
    const givePromises = targets.map(async (target) => {
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
    });

    return Promise.all(givePromises).then((messages) => messages.join(""));
  }

  protected async transferItem(
    initiator: GuildMember,
    targets: GuildMember[],
    item: Item
  ): Promise<string> {
    const userItem = await this.inventoryService?.getUserItem(initiator, item);
    if (!userItem) {
      return `${initiator.displayName} does not have any ${item.name} to give away`;
    }

    const unusedItemCount = Math.floor(userItem.remainingUses / userItem.maxUses);
    if (unusedItemCount < targets.length) {
      return (
        `You need ${targets.length - unusedItemCount} more unused items for that. ` +
        `Unused ${userItem.name} in inventory: ${unusedItemCount}`
      );
    }

    const givePromises = targets.map((target) => {
      return this.inventoryService?.transferItem(userItem, initiator, target).then(() => {
        return `Transferred one ${item.name} to ${target.toString()}\n`;
      });
    });

    return Promise.all(givePromises).then((messages) => {
      return messages.join("");
    });
  }
}
