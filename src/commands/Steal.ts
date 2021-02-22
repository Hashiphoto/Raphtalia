import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import { GuildMember } from "discord.js";
import RNumber from "../structures/RNumber";
import UserItem from "../structures/UserItem";
import Util from "../Util";

export default class Steal extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Steal**\nAttempt to take an item from another user. " +
      "Costs 5% of your balance or $1000 per attempt, whichever is greater.";
    this.usage = "Usage: `Steal @member (item name)`";
  }

  public async execute(): Promise<any> {
    const targets = this.ec.messageHelper.mentionedMembers;
    if (this.ec.messageHelper.args.length === 0 || targets.length === 0) {
      return this.sendHelpMessage();
    }
    if (targets.length > 1) {
      return this.sendHelpMessage(`You can only attempt to steal from one person at a time`);
    }

    const target = targets[0];

    // Parse item name
    const itemName = this.ec.messageHelper.parsedContent
      .substring(this.ec.messageHelper.parsedContent.lastIndexOf(">") + 1)
      .trim();

    if (itemName === "") {
      return this.sendHelpMessage();
    }

    const targetItem = await this.ec.inventoryController.findUserItem(target, itemName);

    if (!targetItem) {
      const serviceFee = 100;
      await this.ec.currencyController.transferCurrency(
        this.ec.initiator,
        this.ec.raphtalia,
        serviceFee
      );
      return this.sendHelpMessage(
        `${target.toString()} does not have any item named "${itemName}". ` +
          `Charged a ${RNumber.formatDollar(serviceFee)} service fee.`
      );
    }

    const initiatorBalance = await this.ec.currencyController.getCurrency(this.ec.initiator);
    const cost = Math.max(initiatorBalance * 0.05, 1000);
    await this.ec.currencyController.transferCurrency(this.ec.initiator, this.ec.raphtalia, cost);

    // Round to two decimal places and make an integer
    // e.g. 99.5313% -> 99.5313 -> 99.53 -> 9953
    const itemIntegrity = targetItem.integrity;
    const integrityNormalized = Util.round(itemIntegrity * 100) * 100;
    const roll = Util.random(10000);

    let response = `Spent ${RNumber.formatDollar(cost)} for a ${RNumber.formatPercent(
      1 - itemIntegrity
    )} chance at stealing a ${targetItem.printName()}\n`;

    if (roll >= integrityNormalized) {
      await this.takeItem(targetItem, target);
      response += `${targetItem.printName()} successfully stolen!\n`;
    } else {
      response += `Steal attempt failed!\n`;
    }
    await this.ec.channelHelper.watchSend(response);

    await this.useItem(targets.length);
  }

  private async takeItem(item: UserItem, target: GuildMember) {
    await this.ec.inventoryController.transferItem(item, target, this.ec.initiator);
    return await this.ec.channelHelper.watchSend(
      `Transferred one ${item.name} from ${target.toString()} to ${this.ec.initiator.toString()}\n`
    );
  }
}
