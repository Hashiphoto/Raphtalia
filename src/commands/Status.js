import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";
import InventoryController from "../controllers/InventoryController.js";

class Status extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {InventoryController} inventoryController
   */
  constructor(message, currencyController, inventoryController) {
    super(message);
    this.currencyController = currencyController;
    this.inventoryController = inventoryController;
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

    return this.inputChannel.watchSend({ embed: inventoryEmbed });
  }
}

export default Status;
