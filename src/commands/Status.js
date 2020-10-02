import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";

class Status extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   */
  constructor(message, currencyController) {
    super(message);
    this.currencyController = currencyController;
    this.instructions = "**Status**\nPost your current balance and inventory in this channel";
    this.usage = "Usage: `Status`";
  }

  async execute() {
    const balanceMessage = await this.currencyController
      .getCurrency(this.sender)
      .then((balance) => {
        return `**Balance**: ${RNumber.formatDollar(balance)}\n`;
      });

    const inventoryEmbed = await this.inventoryController
      .getUserInventory(this.message.sender)
      .then((userInventory) => {
        return userInventory.toEmbed();
      });

    return this.inputChannel.watchSend(balanceMessage, inventoryEmbed).then(() => this.useItem());
  }
}

export default Status;