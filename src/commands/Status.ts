import Command from "./Command";
import { GuildMember } from "discord.js";
import RNumber from "../models/RNumber";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Status extends Command {
  public constructor() {
    super();
    this.instructions = "**Status**\nPost your current balance and inventory in this channel";
    this.usage = "Usage: `Status`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    const showPublic =
      this.ec.messageHelper.args.length > 0 &&
      this.ec.messageHelper.args[0].toLowerCase() === "show";

    const balanceMessage = await this._currencyService.getCurrency(initiator).then((balance) => {
      return `**Balance**: ${RNumber.formatDollar(balance)}\n`;
    });

    const infractionMessage = await this.ec.memberController
      .getInfractions(initiator)
      .then((infractions) => {
        return `**Infractions**: ${infractions}\n`;
      });

    const inventoryEmbed = await this._inventoryService
      .getUserInventory(initiator)
      .then((userInventory) => {
        return userInventory.toEmbed();
      });

    if (showPublic) {
      this.reply(balanceMessage + infractionMessage, inventoryEmbed);
    } else {
      const dmChannel = await initiator.createDM();
      return dmChannel.send(balanceMessage + infractionMessage, inventoryEmbed);
    }
    await this.useItem(initiator);
  }
}
