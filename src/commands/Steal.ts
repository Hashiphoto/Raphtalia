import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import UserItem from "../models/UserItem";
import ClientService from "../services/Client.service";
import CurrencyService from "../services/Currency.service";
import { Dice, roll } from "../utilities/Rng";
import { Format, print } from "../utilities/Util";
import Command from "./Command";

@autoInjectable()
export default class Steal extends Command {
  public constructor(
    @inject(CurrencyService) private _currencyService?: CurrencyService,
    @inject(delay(() => ClientService)) private _clientService?: ClientService
  ) {
    super();
    this.name = "Steal";
    this.instructions =
      "Attempt to take an item from another user. " +
      "Odds of success are 1/20, or 2/20 if the user has had the item for more than 3 days. Cost of steal attempt = `odds * item price * 110%`";
    this.usage = "`Steal @member (item name)`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member || !cmdMessage.message.guild) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    const itemName = cmdMessage.parsedContent
      .substring(cmdMessage.parsedContent.lastIndexOf(">") + 1)
      .trim();

    if (cmdMessage.memberMentions.length === 0) {
      await this.sendHelpMessage();
      return;
    }
    if (cmdMessage.memberMentions.length > 1) {
      await this.sendHelpMessage(`You can only attempt to steal from one person at a time`);
      return;
    }
    const target = cmdMessage.memberMentions[0];

    const userItem = await this.inventoryService?.findUserItem(target, itemName);
    if (!userItem) {
      const guildItem = await this.inventoryService?.findGuildItem(target.guild.id, itemName);
      if (!guildItem) {
        this.reply(`Item "${itemName}" does not exist`);
        return;
      }
      this.reply(`${target.displayName} does not have any ${guildItem.printName()} to steal`);
      return;
    }

    await this.run(cmdMessage.message.member, target, userItem);
  }

  public async execute(
    initiator: GuildMember,
    target: GuildMember,
    userItem: UserItem
  ): Promise<number | undefined> {
    const raphtalia = this._clientService?.getRaphtaliaMember(initiator.guild) as GuildMember;
    if (userItem.isStealProtected) {
      return this.sendHelpMessage(`${userItem.printName()} cannot be stolen.`);
    }

    const dc = userItem.stealDc;

    const odds = (Dice.D20 - dc + 1) / Dice.D20; // The odds of making a successful steal
    const cost = userItem.price * 1.1 * odds; // Steal costs 10% more than the percentage of the odds of the guild price

    await this._currencyService?.transferCurrency(initiator, raphtalia, cost);

    let response = "";
    const dieResult = roll(Dice.D20);

    if (dieResult.against(dc)) {
      await this.inventoryService?.transferItem(userItem, target, initiator);
      response +=
        `**${userItem.name} successfully stolen!** ` +
        `Transferred one ${userItem.printName()} from ${target.displayName} to ${
          initiator.displayName
        }\n`;
    } else {
      response += `**Steal attempt failed!**\n`;
    }

    response +=
      `Rolled a \`<${dieResult.result}>\` against \`${dc}\`\n` +
      `*Charged ${print(cost, Format.Dollar)} for this attempt*`;
    await this.reply(response);

    return 1;
  }
}
