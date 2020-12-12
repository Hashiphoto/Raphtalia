import Discord from "discord.js";

import Command from "./Command.js";
import RNumber from "../structures/RNumber.js";
import CurrencyController from "../controllers/CurrencyController.js";
import MemberController from "../controllers/MemberController.js";
import UserItem from "../structures/UserItem.js";

class Give extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {MemberController} memberController
   * @param {Discord.Client} client
   */
  constructor(message, currencyController, memberController, client) {
    super(message);
    this.currencyController = currencyController;
    this.memberController = memberController;
    this.client = client;
    this.instructions =
      "**Give**\nGive the specified member(s) either an amount of money or an item. " +
      "If multiple members are listed, each member will be given the amount of money specified. " +
      "When giving an item, each member will be given one of that item. Only unused items can be given.";
    this.usage = "Usage: `Give @member ($1|item name)`";
  }

  execute() {
    const targets = this.message.mentionedMembers;
    if (this.message.args.length === 0 || targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let rNumber = RNumber.parse(this.message.content);
    if (rNumber) {
      rNumber.type = RNumber.types.DOLLAR;
      return this.giveMoney(rNumber, targets).then(() => this.useItem(targets.length));
    }

    // Parse item name
    const itemName = this.message.content
      .substring(this.message.content.lastIndexOf(">") + 1)
      .trim();

    if (itemName === "") {
      return this.sendHelpMessage();
    }

    return this.inventoryController.findUserItem(this.message.sender, itemName).then((item) => {
      if (!item) {
        return this.sendHelpMessage(
          `You do not have any item named "${itemName}". ` +
            `If you are attempting to send money, make sure to format it as \`$1\``
        );
      }
      return this.giveItem(item, targets).then(() => this.useItem(targets.length));
    });
  }

  /**
   * @param {RNumber} rNumber
   * @param {Discord.GuildMember[]} targets
   */
  giveMoney(rNumber, targets) {
    if (rNumber.amount < 0) {
      return this.inputChannel.watchSend("You cannot send a negative amount of money\n");
    }

    let totalAmount = rNumber.amount * targets.length;
    return this.currencyController.getCurrency(this.sender).then((balance) => {
      if (balance < totalAmount) {
        return this.inputChannel.watchSend(
          `You do not have enough money for that. ` +
            `Funds needed: ${RNumber.formatDollar(totalAmount)}`
        );
      }

      const givePromises = targets.map((target) => {
        // Giving money to Raphtalia, presumably for a contest
        if (target.id === this.client.user.id) {
          return this.currencyController
            .bidOnRoleContest(this.message.member.roles.hoist, this.message.member, rNumber.amount)
            .then((roleContest) =>
              roleContest
                ? `Paid ${rNumber.toString()} towards contesting the ${
                    this.message.guild.roles.cache.get(roleContest.roleId).name
                  } role!`
                : `Thanks for the ${rNumber.toString()}!`
            );
        } else {
          return this.currencyController
            .transferCurrency(this.sender, target, rNumber.amount)
            .then(() => `Transfered ${rNumber.toString()} to ${target}!`);
        }
      });

      return Promise.all(givePromises)
        .then((messages) => messages.reduce(this.sum))
        .then((response) => this.inputChannel.watchSend(response));
    });
  }

  /**
   * @param {UserItem} item
   * @param {Discord.GuildMember[]} targets
   */
  giveItem(item, targets) {
    const unusedItems = Math.floor(item.remainingUses / item.maxUses);
    if (unusedItems < targets.length) {
      return this.inputChannel.watchSend(
        `You need ${targets.length - unusedItems} more unused items for that. ` +
          `Unused ${item.name} in inventory: ${unusedItems}`
      );
    }

    const givePromises = targets.map((target) => {
      return this.inventoryController.transferItem(item, this.message.sender, target).then(() => {
        return `Transferred one ${item.name} to ${target}\n`;
      });
    });

    return Promise.all(givePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response));
  }
}

export default Give;
