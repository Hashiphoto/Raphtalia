import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import Discord from "discord.js";
import MemberController from "../controllers/MemberController.js";
import RNumber from "../structures/RNumber.js";
import UserItem from "../structures/UserItem.js";

class Take extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {MemberController} memberController
   */
  constructor(message, currencyController, memberController) {
    super(message);
    this.currencyController = currencyController;
    this.memberController = memberController;
    this.instructions =
      "**Take**\nTake money or items from the specified user. " +
      "You can take money from multiple users at once, but only one item from one user at a time.";
    this.usage = "Usage: `Take @member ($1|item name)`";
  }

  execute(): Promise<any> {
    const targets = this.message.mentionedMembers;
    if (this.message.args.length === 0 || targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let rNumber = RNumber.parse(this.message.content);
    if (rNumber) {
      return this.takeMoney(rNumber, targets).then(() => this.useItem(targets.length));
    }

    if (targets.length > 1) {
      return this.sendHelpMessage("You cannot take an item from more than one member at a time");
    }

    const target = targets[0];

    // Parse item name
    const itemName = this.message.content
      .substring(this.message.content.lastIndexOf(">") + 1)
      .trim();

    if (itemName === "") {
      return this.sendHelpMessage();
    }

    return this.inventoryController.findUserItem(target, itemName).then((item) => {
      if (!item) {
        return this.sendHelpMessage(
          `${target} does not have any item named "${itemName}". ` +
            `If you are attempting to take money, make sure to format it as \`$1\``
        );
      }
      return this.takeItem(item, target).then(() => this.useItem(targets.length));
    });
  }

  /**
   * @param {RNumber} rNumber
   */
  takeMoney(rNumber, targets) {
    if (rNumber.amount < 0) {
      return this.ec.channelHelper.watchSend("You cannot take a negative amount of money\n");
    }

    const givePromises = targets.map((target) => {
      return this.currencyController
        .transferCurrency(target, this.sender, rNumber.amount)
        .then(() => `Transfered ${rNumber.toString()} from ${target} to ${this.sender}!`);
    });

    return Promise.all(givePromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.ec.channelHelper.watchSend(response));
  }

  /**
   * @param {UserItem} item
   */
  takeItem(item, target) {
    return this.inventoryController.transferItem(item, target, this.sender).then(() => {
      return this.ec.channelHelper.watchSend(
        `Transferred one ${item.name} from ${target} to ${this.sender}\n`
      );
    });
  }
}

export default Take;
