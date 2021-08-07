import Command from "./Command";
import Dice from "../../Dice";
import { GuildMember } from "discord.js";
import RNumber from "../models/RNumber";
import UserItem from "../models/UserItem";
import { autoInjectable } from "tsyringe";

const serviceFee = 100;
const minStealCost = 1000;
const percentCost = 0.05;

@autoInjectable()
export default class Steal extends Command {
  public constructor() {
    super();
    this.instructions =
      "**Steal**\nAttempt to take an item from another user. " +
      "Costs 5% of your balance or $1000 per attempt, whichever is greater.";
    this.usage = "Usage: `Steal @member (item name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
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

    const targetItem = await this._inventoryService.findUserItem(target, itemName);

    if (!targetItem || targetItem.isStealProtected) {
      await this._currencyService.transferCurrency(initiator, this.ec.raphtalia, serviceFee);
      const message = targetItem
        ? `${targetItem.printName()} cannot be stolen.`
        : `${target.toString()} does not have any item named "${itemName}".`;
      return this.sendHelpMessage(
        `${message} Charged a ${RNumber.formatDollar(serviceFee)} service fee.`
      );
    }

    // TODO: Simplify code with Scan
    const initiatorBalance = await this._currencyService.getCurrency(initiator);
    if (initiatorBalance < minStealCost) {
      return this.reply(
        `You need at least ${RNumber.formatDollar(minStealCost)} to attempt a steal`
      );
    }
    const cost = Math.max(initiatorBalance * percentCost, minStealCost);
    await this._currencyService.transferCurrency(initiator, this.ec.raphtalia, cost);

    const roll = Dice.Roll(20);
    const dc = targetItem.stealDc;

    let response = "";

    if (roll >= dc) {
      const takeResponse = await this.takeItem(targetItem, target);
      response += `**${targetItem.name} successfully stolen!** ${takeResponse}\n`;
    } else {
      response += `**Steal attempt failed!**\n`;
    }

    response +=
      `Rolled a \`<${roll}>\` against \`${dc}\`\n` +
      `*Charged ${RNumber.formatDollar(cost)} for this attempt*`;
    await this.reply(response);

    await this.useItem(targets.length);
  }

  private async takeItem(item: UserItem, target: GuildMember) {
    await this._inventoryService.transferItem(item, target, initiator);
    return `Transferred one ${item.name} from ${target.toString()} to ${initiator.toString()}`;
  }
}
