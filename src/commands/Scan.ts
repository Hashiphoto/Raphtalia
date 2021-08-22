import { Dice, roll } from "../utilities/Rng";
import { Format, print } from "../utilities/Util";
import { GuildMember, TextChannel } from "discord.js";

import ClientService from "../services/Client.service";
import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import CurrencyService from "../services/Currency.service";
import GuildItem from "../models/GuildItem";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import UserItem from "../models/UserItem";
import { autoInjectable } from "tsyringe";

const serviceFee = 50;
const minScanCost = 250;
const percentCost = 0.05;

@autoInjectable()
export default class Scan extends Command {
  public constructor(
    private _currencyService?: CurrencyService,
    private _clientService?: ClientService
  ) {
    super();
    this.instructions = "**Scan**\nSearch other users' inventories for a specified item. ";
    this.usage = "Usage: `Scan (item name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.parsedContent);
  }

  public async execute(initiator: GuildMember, itemName: string): Promise<any> {
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this.inventoryService?.findGuildItem(initiator.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        return this.reply(`There is more than one item with that name. Matches: ${error.message}`);
      }
      throw error;
    }
    if (!guildItem) {
      return this.reply(`There are no items named "${itemName}"`);
    }

    // TODO: Simplify code with Steal
    const initiatorBalance = await this._currencyService?.getCurrency(initiator);
    if (!initiatorBalance || initiatorBalance < minScanCost) {
      return this.reply(
        `You need at least ${print(minScanCost, Format.Dollar)} to attempt a scan.`
      );
    }

    const cost = Math.max(initiatorBalance * percentCost, minScanCost);
    await this._currencyService?.transferCurrency(
      initiator,
      this._clientService?.getRaphtaliaMember(initiator.guild) as GuildMember,
      cost
    );

    const usersWithItem = (await this.inventoryService?.findUsersWithItem(guildItem)) as UserItem[];
    const members = await initiator.guild.members.fetch({
      user: usersWithItem.map((ui) => ui.userId),
    });

    let deciphered = 0;
    const memberNames = members.reduce((sum, member) => {
      if (roll(Dice.D20).against(10)) {
        deciphered++;
        return sum + `\t- ${member.displayName}\n`;
      }
      return sum + "\t- ~~unknown~~\n";
    }, "");

    let response = `Deciphered ${deciphered}/${
      usersWithItem?.length
    } members with a ${guildItem.printName()}:\n${memberNames}`;

    response += `*Charged ${print(cost, Format.Dollar)} for this scan*`;

    await this.reply(response);
  }
}
