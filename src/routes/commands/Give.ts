import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import { GuildMember } from "discord.js";
import RNumber from "../../models/RNumber";
import UserItem from "../../models/UserItem";

export default class Give extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Give**\nGive the specified member(s) either an amount of money or an item. " +
      "If multiple members are listed, each member will be given the amount of money specified. " +
      "When giving an item, each member will be given one of that item. Only unused items can be given.";
    this.usage = "Usage: `Give @member ($1|item name)`";
  }

  public async execute(): Promise<any> {
    const targets = this.ec.messageHelper.mentionedMembers;
    if (this.ec.messageHelper.args.length === 0 || targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    const rNumber = RNumber.parse(this.ec.messageHelper.parsedContent);
    if (rNumber) {
      rNumber.type = RNumber.Types.DOLLAR;
      return this.giveMoney(rNumber, targets).then(() => this.useItem(targets.length));
    }

    // Parse item name
    const itemName = this.ec.messageHelper.parsedContent
      .substring(this.ec.messageHelper.parsedContent.lastIndexOf(">") + 1)
      .trim();

    if (itemName === "") {
      return this.sendHelpMessage();
    }

    return this.ec.inventoryController.findUserItem(this.ec.initiator, itemName).then((item) => {
      if (!item) {
        this.sendHelpMessage(
          `You do not have any item named "${itemName}". ` +
            `If you are attempting to send money, make sure to format it as \`$1\``
        );
        return;
      }
      return this.giveItem(item, targets).then(() => this.useItem(targets.length));
    });
  }

  private giveMoney(rNumber: RNumber, targets: GuildMember[]) {
    if (rNumber.amount < 0) {
      return this.ec.channelHelper.watchSend("You cannot send a negative amount of money\n");
    }

    const totalAmount = rNumber.amount * targets.length;
    return this.ec.currencyController.getCurrency(this.ec.initiator).then((balance) => {
      if (balance < totalAmount) {
        return this.ec.channelHelper.watchSend(
          `You do not have enough money for that. ` +
            `Funds needed: ${RNumber.formatDollar(totalAmount)}`
        );
      }

      const givePromises = targets.map((target) =>
        this.ec.currencyController
          .transferCurrency(this.ec.initiator, target, rNumber.amount)
          .then(() => {
            // Giving money to Raphtalia, presumably for a contest
            if (target.id === this.ec.raphtalia.id && this.ec.initiator.roles.hoist) {
              return this.ec.roleContestController
                .bidOnRoleContest(this.ec.initiator.roles.hoist, this.ec.initiator, rNumber.amount)
                .then((roleContest) =>
                  roleContest
                    ? `Paid ${rNumber.toString()} towards contesting the ${
                        this.ec.guild.roles.cache.get(roleContest.roleId)?.name
                      } role!`
                    : `Thanks for the ${rNumber.toString()}!`
                );
            } else {
              return `Transfered ${rNumber.toString()} to ${target.toString()}!`;
            }
          })
      );

      return Promise.all(givePromises)
        .then((messages) => messages.reduce(this.sum))
        .then((response) => this.ec.channelHelper.watchSend(response));
    });
  }

  private giveItem(item: UserItem, targets: GuildMember[]) {
    const unusedItems = Math.floor(item.remainingUses / item.maxUses);
    if (unusedItems < targets.length) {
      return this.ec.channelHelper.watchSend(
        `You need ${targets.length - unusedItems} more unused items for that. ` +
          `Unused ${item.name} in inventory: ${unusedItems}`
      );
    }

    const givePromises = targets.map((target) => {
      return this.ec.inventoryController.transferItem(item, this.ec.initiator, target).then(() => {
        return `Transferred one ${item.name} to ${target.toString()}\n`;
      });
    });

    return Promise.all(givePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response));
  }
}
