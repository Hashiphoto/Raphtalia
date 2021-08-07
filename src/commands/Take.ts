import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import RaphError from "../models/RaphError";
import RNumber from "../models/RNumber";
import UserItem from "../models/UserItem";
import CurrencyService from "../services/Currency.service";
import { sumString } from "../services/Util";
import Command from "./Command";

@autoInjectable()
export default class Take extends Command {
  public constructor(private _currencyService?: CurrencyService) {
    super();
    this.instructions =
      "**Take**\nTake money or items from the specified user. " +
      "You can take money from multiple users at once, but only one item from one user at a time.";
    this.usage = "Usage: `Take @member ($1|item name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.memberMentions);
  }

  public async execute(
    initiator: GuildMember,
    targets: GuildMember[],
    amount?: number,
    item?: UserItem
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

    if (amount) {
      await this.takeMoney(initiator, targets, amount);
    }
    if (item) {
      await this.takeItem(initiator, targets, item);
    }
    await this.useItem(initiator, targets.length);

    const rNumber = RNumber.parse(this.ec.messageHelper.parsedContent);
    if (rNumber) {
      return this.takeMoney(rNumber, targets).then(() => this.useItem(initiator, targets.length));
    }

    if (targets.length > 1) {
      return this.sendHelpMessage("You cannot take an item from more than one member at a time");
    }

    const target = targets[0];

    // Parse item name
    const itemName = this.ec.messageHelper.parsedContent
      .substring(this.ec.messageHelper.parsedContent.lastIndexOf(">") + 1)
      .trim();

    if (itemName === "") {
      return this.sendHelpMessage();
    }

    return this._inventoryService.findUserItem(target, itemName).then(async (item) => {
      if (!item) {
        return this.sendHelpMessage(
          `${target.toString()} does not have any item named "${itemName}". ` +
            `If you are attempting to take money, make sure to format it as \`$1\``
        );
      }
      return this.takeItem(item, target).then(() => this.useItem(targets.length));
    });
  }

  private async takeMoney(initiator: GuildMember, targets: GuildMember[], amount: number) {
    if (amount < 0) {
      return this.reply("You cannot take a negative amount of money\n");
    }

    const moneyPromises = targets.map((target) => {
      return this._currencyService
        ?.transferCurrency(target, initiator, amount)
        .then(
          () =>
            `Transfered ${amount.toString()} from ${target.toString()} to ${initiator.toString()}!\n`
        );
    });

    return Promise.all(moneyPromises)
      .then((messages) => messages.reduce(sumString))
      .then((response) => this.reply(response));
  }

  private takeItem(initiator: GuildMember, targets: GuildMember[], item: UserItem) {
    const itemPromises = 

    return this._inventoryService.transferItem(item, target, initiator).then(() => {
      return this.reply(
        `Transferred one ${item.name} from ${target.toString()} to ${initiator.toString()}\n`
      );
    });
  }
}
