import { Format, print } from "../utilities/Util";
import { GuildMember, MessageEmbed, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import CurrencyService from "../services/Currency.service";
import MemberService from "../services/Member.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

enum Args {
  SHOW,
}

@autoInjectable()
export default class Status extends Command {
  public constructor(
    private _currencyService?: CurrencyService,
    private _memberService?: MemberService
  ) {
    super();
    this.instructions = "**Status**\nPost your current balance and inventory in this channel";
    this.usage = "Usage: `Status`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    return this.execute(
      cmdMessage.message.member,
      cmdMessage.args.length > 0 ? cmdMessage.args[Args.SHOW].toLowerCase() === "show" : false
    );
  }

  public async execute(initiator: GuildMember, show = false): Promise<any> {
    const balanceMessage = await this._currencyService?.getCurrency(initiator).then((balance) => {
      return `**Balance**: ${print(balance, Format.Dollar)}\n`;
    });

    const infractionMessage = await this._memberService
      ?.getInfractions(initiator)
      .then((infractions) => {
        return `**Infractions**: ${infractions}\n`;
      });

    const inventoryEmbed = (await this.inventoryService
      ?.getUserInventory(initiator)
      .then((userInventory) => {
        return userInventory.toEmbed();
      })) as MessageEmbed;

    const message = `${balanceMessage}${infractionMessage}`;

    if (show) {
      await this.reply(message, inventoryEmbed);
    } else {
      const dmChannel = await initiator.createDM();
      await dmChannel.send(message, inventoryEmbed);
    }
    await this.useItem(initiator);
  }
}
