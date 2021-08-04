import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import RNumber from "../../models/RNumber";

export default class Status extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Status**\nPost your current balance and inventory in this channel";
    this.usage = "Usage: `Status`";
  }

  public async execute(): Promise<any> {
    const showPublic =
      this.ec.messageHelper.args.length > 0 &&
      this.ec.messageHelper.args[0].toLowerCase() === "show";

    const balanceMessage = await this.ec.currencyController
      .getCurrency(this.ec.initiator)
      .then((balance) => {
        return `**Balance**: ${RNumber.formatDollar(balance)}\n`;
      });

    const infractionMessage = await this.ec.memberController
      .getInfractions(this.ec.initiator)
      .then((infractions) => {
        return `**Infractions**: ${infractions}\n`;
      });

    const inventoryEmbed = await this.ec.inventoryController
      .getUserInventory(this.ec.initiator)
      .then((userInventory) => {
        return userInventory.toEmbed();
      });

    if (showPublic) {
      this.ec.channelHelper.watchSend(balanceMessage + infractionMessage, inventoryEmbed);
    } else {
      const dmChannel = await this.ec.initiator.createDM();
      return dmChannel.send(balanceMessage + infractionMessage, inventoryEmbed);
    }
    await this.useItem();
  }
}
