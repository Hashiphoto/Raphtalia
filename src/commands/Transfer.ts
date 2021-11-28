import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import CurrencyService from "../services/Currency.service";
import { ITargettedProps } from "../interfaces/CommandInterfaces";
import Item from "../models/Item";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { parseNumber } from "../utilities/Util";

export interface ITransferProps extends ITargettedProps {
  amount?: number;
  item?: Item;
}

export default abstract class Transfer extends Command<ITransferProps> {
  public constructor(protected currencyService?: CurrencyService) {
    super();
    this.name = "Transfer";
    this.aliases = [this.name.toLowerCase()];
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
      return "You cannot transfer a negative amount of money\n";
    }

    const moneyPromises = targets.map((target) => {
      return this.currencyService
        ?.transferCurrency(target, initiator, amount)
        .then(
          () =>
            `Transfered ${amount.toString()} from ${target.toString()} to ${initiator.toString()}!\n`
        );
    });

    return Promise.all(moneyPromises).then((messages) => messages.join(""));
  }

  protected async transferItem(
    initiator: GuildMember,
    targets: GuildMember[],
    item: Item
  ): Promise<string> {
    const itemPromises = targets.map(async (target) => {
      const targetItem = await this.inventoryService?.getUserItem(target, item);
      if (!targetItem) {
        return `${target.displayName} has no ${item.name}`;
      }
      return this.inventoryService
        ?.transferItem(targetItem, target, initiator)
        .then(
          () =>
            `Transferred one ${item.name} from ${target.toString()} to ${initiator.toString()}\n`
        );
    });

    return Promise.all(itemPromises).then((messages) => messages.join(""));
  }
}
