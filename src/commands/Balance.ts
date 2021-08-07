import Command from "./Command";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import CurrencyService from "../services/Currency.service";
import { GuildMember } from "discord.js";
import RNumber from "../models/RNumber";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

enum Args {
  SHOW,
}

@autoInjectable()
export default class Balance extends Command {
  public constructor(private _currencyService?: CurrencyService) {
    super();
    this.instructions = "**Balance**\nGet your current balance sent to you in a direct message";
    this.usage = "Usage: `Balance`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, args: string[]): Promise<any> {
    const showPublic = args.length > 0 && args[Args.SHOW] === "show";

    const balance = await this._currencyService?.getCurrency(initiator);
    const messageText = `You have ${RNumber.formatDollar(balance)} in ${initiator.guild.name}`;

    if (showPublic) {
      this.reply(messageText);
    } else {
      const dmChannel = await initiator.createDM();
      dmChannel.send(messageText);
    }

    await this.useItem(initiator);
  }
}
