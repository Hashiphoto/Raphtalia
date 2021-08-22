import { GuildMember, TextChannel } from "discord.js";
import { parseNumber, sumString } from "../utilities/Util";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import CurrencyService from "../services/Currency.service";
import Item from "../models/Item";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Take extends Command {
  public constructor(protected currencyService?: CurrencyService) {
    super();
    this.instructions =
      "**Take**\nTake money or items from the specified user. " +
      "You can take money from multiple users at once, but only one item from one user at a time.";
    this.usage = "Usage: `Take @member ($1|item name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
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

    return this.execute(cmdMessage.message.member, cmdMessage.memberMentions, amount, guildItem);
  }

  public async execute(
    initiator: GuildMember,
    targets: GuildMember[],
    amount?: number,
    item?: Item
  ): Promise<any> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
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

    await this.useItem(initiator, targets.length);
    console.log("Replying" + response);
    await this.reply(response);
  }

  protected async transferMoney(
    initiator: GuildMember,
    targets: GuildMember[],
    amount: number
  ): Promise<string> {
    if (amount < 0) {
      return "You cannot take a negative amount of money\n";
    }

    const moneyPromises = targets.map((target) => {
      return this.currencyService
        ?.transferCurrency(target, initiator, amount)
        .then(
          () =>
            `Transfered ${amount.toString()} from ${target.toString()} to ${initiator.toString()}!\n`
        );
    });

    return Promise.all(moneyPromises).then((messages) => messages.reduce(sumString) ?? "");
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

    return Promise.all(itemPromises).then((messages) => messages.reduce(sumString) ?? "");
  }
}
