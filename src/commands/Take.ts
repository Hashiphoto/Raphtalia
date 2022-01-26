import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import CurrencyService from "../services/Currency.service";
import GuildItem from "../models/GuildItem";
import { ITransferProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import { parseNumber } from "../utilities/Util";

@autoInjectable()
export default class Take extends Command<ITransferProps> {
  public constructor(protected currencyService?: CurrencyService) {
    super();
    this.name = "Take";
    this.instructions =
      "Take money or items from the specified user. " +
      "You can take money from multiple users at once, but only one item from one user at a time.";
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
      this.queueReply(
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

    this.queueReply(response);
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
    item: GuildItem
  ): Promise<string> {
    const itemPromises = targets.map(async (target) => {
      const targetItem = await this.inventoryService?.getUserItems(target, item);
      if (!targetItem?.length) {
        return `${target.displayName} has no ${item.name}`;
      }
      return this.inventoryService
        ?.transferItem(targetItem[0], initiator)
        .then(
          () =>
            `Transferred one ${item.name} from ${target.toString()} to ${initiator.toString()}\n`
        );
    });

    return Promise.all(itemPromises).then((messages) => messages.join(""));
  }
}
