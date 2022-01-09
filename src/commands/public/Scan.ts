import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../../enums/Result";
import { IArgProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import GuildItem from "../../models/GuildItem";
import RaphError from "../../models/RaphError";
import UserItem from "../../models/UserItem";
import ClientService from "../../services/Client.service";
import CurrencyService from "../../services/Currency.service";
import { Dice, roll } from "../../utilities/Rng";
import { Format, print } from "../../utilities/Util";
import Command from "../Command";

const percentCost = 0.05;

@autoInjectable()
export default class Scan extends Command<IArgProps> {
  public constructor(
    @inject(CurrencyService) private _currencyService?: CurrencyService,
    @inject(delay(() => ClientService)) private _clientService?: ClientService
  ) {
    super();
    this.name = "Scan";
    this.instructions = `Search other users' inventories for a specified item. Costs ${print(
      percentCost,
      Format.Percent
    )} of the item's store price. DC10 to reveal the user's name`;
    this.usage = "`Scan (item name)`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage();
      return;
    }
    await this.runWithItem({ initiator: cmdMessage.message.member, arg: cmdMessage.parsedContent });
  }

  public async execute({ initiator, arg: itemName }: IArgProps): Promise<number | undefined> {
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this.inventoryService?.findGuildItem(initiator.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        await this.reply(`There is more than one item with that name. Matches: ${error.message}`);
        return;
      }
      throw error;
    }
    if (!guildItem) {
      await this.reply(`There are no items named "${itemName}"`);
      return;
    }

    // TODO: Simplify code with Steal
    const initiatorBalance = await this._currencyService?.getCurrency(initiator);
    const cost = guildItem.price * percentCost;
    if (!initiatorBalance || initiatorBalance < cost) {
      await this.reply(
        `${
          initiator.displayName
        } does not have enough money. Scanning for a ${guildItem.printName()} costs ${print(
          cost,
          Format.Dollar
        )} (${print(percentCost, Format.Percent)} of the store price)`
      );
      return;
    }

    await this._currencyService?.transferCurrency(
      initiator,
      this._clientService?.getRaphtaliaMember(initiator.guild) as GuildMember,
      cost
    );

    const usersWithItem = (
      (await this.inventoryService?.findUsersWithItem(guildItem)) as UserItem[]
    ).filter((item) => item.userId !== initiator.user.id);
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
    return 1;
  }
}
