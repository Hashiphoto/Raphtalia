import AmbiguousInputError from "../models/errors/AmbiguousInputError";
import Command from "./Command";
import Dice from "../../Dice";
import { GuildMember } from "discord.js";
import RNumber from "../models/RNumber";
import { autoInjectable } from "tsyringe";

const serviceFee = 50;
const minScanCost = 250;
const percentCost = 0.05;

@autoInjectable()
export default class Scan extends Command {
  public constructor() {
    super();
    this.instructions = "**Scan**\nSearch other users' inventories for a specified item. ";
    this.usage = "Usage: `Scan (item name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    const targets = this.ec.messageHelper.mentionedMembers;
    // if (this.ec.messageHelper.args.length === 0 && targets.length === 0) {
    //   return this.sendHelpMessage();
    // }

    // if (targets.length > 1) {
    //   return this.sendHelpMessage("You cannot scan more than one person at a time");
    // }

    // // Scan person
    // if (targets.length) {
    //   const target = targets[0];
    // }

    if (targets.length > 0) {
      return this.sendHelpMessage("You can only search for items");
    }

    // Scan for item
    const itemName = this.ec.messageHelper.parsedContent;
    if (itemName === "") {
      return this.sendHelpMessage();
    }

    let targetItem;
    try {
      targetItem = await this._inventoryService.findGuildItem(itemName);
    } catch (e) {
      if (e.name === AmbiguousInputError.name) {
        return this.reply(`Scan canceled. Did you mean ${e.message}?`);
      }
      throw e;
    }
    if (!targetItem) {
      return this.sendHelpMessage(`Could not find any item named "${itemName}"`);
    }

    // TODO: Simplify code with Steal
    const initiatorBalance = await this._currencyService.getCurrency(initiator);
    if (initiatorBalance < minScanCost) {
      return this.reply(
        `You need at least ${RNumber.formatDollar(minScanCost)} to attempt a scan.`
      );
    }

    const cost = Math.max(initiatorBalance * percentCost, minScanCost);
    await this._currencyService.transferCurrency(initiator, this.ec.raphtalia, cost);

    const usersWithItem = await this._inventoryService.findUsersWithItem(targetItem);
    const members = await Promise.all(
      usersWithItem.map(async (next) => this.ec.guild.members.fetch(next.userId))
    );

    let deciphered = 0;
    const memberNames = members.reduce((sum, member) => {
      const roll = Dice.Roll(20);
      if (roll >= 10) {
        deciphered++;
        return sum + `\t- ${member.displayName}\n`;
      }
      return sum + "\t- ~~unknown~~\n";
    }, "");

    let response = `Deciphered ${deciphered}/${
      usersWithItem.length
    } members with a ${targetItem.printName()}:\n${memberNames}`;

    response += `*Charged ${RNumber.formatDollar(cost)} for this scan*`;

    await this.reply(response);
  }
}
