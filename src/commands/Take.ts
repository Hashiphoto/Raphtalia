import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import { GuildMember } from "discord.js";
import RNumber from "../structures/RNumber";
import UserItem from "../structures/UserItem";

export default class Take extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Take**\nTake money or items from the specified user. " +
      "You can take money from multiple users at once, but only one item from one user at a time.";
    this.usage = "Usage: `Take @member ($1|item name)`";
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

    let rNumber = RNumber.parse(this.ec.messageHelper.parsedContent);
    if (rNumber) {
      return this.takeMoney(rNumber, targets).then(() => this.useItem(targets.length));
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

    return this.ec.inventoryController.findUserItem(target, itemName).then(async (item) => {
      if (!item) {
        return this.sendHelpMessage(
          `${target.toString()} does not have any item named "${itemName}". ` +
            `If you are attempting to take money, make sure to format it as \`$1\``
        );
      }
      return this.takeItem(item, target).then(() => this.useItem(targets.length));
    });
  }

  private takeMoney(rNumber: RNumber, targets: GuildMember[]) {
    if (rNumber.amount < 0) {
      return this.ec.channelHelper.watchSend("You cannot take a negative amount of money\n");
    }

    const givePromises = targets.map((target) => {
      return this.ec.currencyController
        .transferCurrency(target, this.ec.initiator, rNumber.amount)
        .then(
          () =>
            `Transfered ${rNumber.toString()} from ${target.toString()} to ${this.ec.initiator.toString()}!`
        );
    });

    return Promise.all(givePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response));
  }

  private takeItem(item: UserItem, target: GuildMember) {
    return this.ec.inventoryController.transferItem(item, target, this.ec.initiator).then(() => {
      return this.ec.channelHelper.watchSend(
        `Transferred one ${
          item.name
        } from ${target.toString()} to ${this.ec.initiator.toString()}\n`
      );
    });
  }
}
