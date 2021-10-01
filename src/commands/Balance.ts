import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import CurrencyService from "../services/Currency.service";
import { Format, print } from "../utilities/Util";
import Command from "./Command";

enum Args {
  SHOW,
}

@autoInjectable()
export default class Balance extends Command {
  public constructor(private _currencyService?: CurrencyService) {
    super();
    this.name = "Balance";
    this.instructions = "Get your current balance sent to you in a direct message";
    this.usage = "`Balance`";
    this.aliases = [this.name.toLowerCase(), "wallet"];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, args: string[]): Promise<number | undefined> {
    const showPublic = args.length > 0 && args[Args.SHOW] === "show";

    const balance = (await this._currencyService?.getCurrency(initiator)) as number;
    const messageText = `You have ${print(balance, Format.Dollar)} in ${initiator.guild.name}`;

    if (showPublic) {
      this.reply(messageText);
    } else {
      const dmChannel = await initiator.createDM();
      dmChannel.send(messageText);
    }
    return 1;
  }
}
