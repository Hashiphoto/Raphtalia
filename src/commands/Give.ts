import { GuildMember } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import Item from "../models/Item";
import RaphError from "../models/RaphError";
import ClientService from "../services/Client.service";
import RoleContestService from "../services/RoleContest.service";
import { Format, print } from "../utilities/Util";
import Transfer from "./Transfer";

@autoInjectable()
export default class Give extends Transfer {
  public constructor(
    @inject(delay(() => ClientService)) private _clientService?: ClientService,
    @inject(delay(() => RoleContestService)) private _roleContestService?: RoleContestService
  ) {
    super();
    this.name = "Give";
    this.instructions =
      "Give the specified member(s) either an amount of money or an item. " +
      "If multiple members are listed, each member will be given the amount of money specified. " +
      "When giving an item, each member will be given one of that item. Only unused items can be given.";
    this.usage = "`Give @member ($1|item name)`";
    this.aliases = [this.name.toLowerCase()];
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
