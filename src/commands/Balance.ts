import { Format, print } from "../utilities/Util";

import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import CurrencyService from "../services/Currency.service";
import { IArgsProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

enum Args {
  SHOW,
}

@autoInjectable()
export default class Balance extends Command<IArgsProps> {
  public constructor(private _currencyService?: CurrencyService) {
    super();
    this.name = "Balance";
    this.instructions = "Get your current balance sent to you in a direct message";
    this.usage = "`Balance`";
    this.aliases = [this.name.toLowerCase(), "wallet"];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute({ initiator, args }: IArgsProps): Promise<number | undefined> {
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
