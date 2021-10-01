import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import CurrencyService from "../services/Currency.service";
import MemberService from "../services/Member.service";
import { Format, print } from "../utilities/Util";
import Command from "./Command";

enum Args {
  SHOW,
}

@autoInjectable()
export default class Status extends Command {
  public constructor(
    @inject(delay(() => CurrencyService)) private _currencyService?: CurrencyService,
    @inject(delay(() => MemberService)) private _memberService?: MemberService
  ) {
    super();
    this.name = "Status";
    this.instructions = "Post your current balance and inventory in this channel";
    this.usage = "`Status`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    await this.run(
      cmdMessage.message.member,
      cmdMessage.args.length > 0 ? cmdMessage.args[Args.SHOW].toLowerCase() === "show" : false
    );
  }

  public async execute(initiator: GuildMember, show = false): Promise<number | undefined> {
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

    const content = `${balanceMessage}${infractionMessage}`;

    if (show) {
      await this.reply(content, { embeds: [inventoryEmbed] });
    } else {
      const dmChannel = await initiator.createDM();
      await dmChannel.send({ content, embeds: [inventoryEmbed] });
    }
    return 1;
  }
}
