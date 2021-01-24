import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import Discord from "discord.js";
import MemberController from "../controllers/MemberController.js";
import RNumber from "../structures/RNumber.js";

class Status extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {MemberController} memberController
   */
  constructor(message, currencyController, memberController) {
    super(message);
    this.currencyController = currencyController;
    this.memberController = memberController;
    this.instructions = "**Status**\nPost your current balance and inventory in this channel";
    this.usage = "Usage: `Status`";
  }

  async execute(): Promise<any> {
    const balanceMessage = await this.currencyController
      .getCurrency(this.sender)
      .then((balance) => {
        return `**Balance**: ${RNumber.formatDollar(balance)}\n`;
      });

    const infractionMessage = await this.memberController
      .getInfractions(this.message.member)
      .then((infractions) => {
        return `**Infractions**: ${infractions}\n`;
      });

    const inventoryEmbed = await this.inventoryController
      .getUserInventory(this.message.sender)
      .then((userInventory) => {
        return userInventory.toEmbed();
      });

    const dmChannel = await this.sender.createDM();
    return dmChannel
      .send(balanceMessage + infractionMessage, inventoryEmbed)
      .then(() => this.useItem());
  }
}

export default Status;
