import Discord from "discord.js";
import CurrencyController from "../controllers/CurrencyController.js";
import InventoryController from "../controllers/InventoryController.js";
import ServerStatusController from "../controllers/ServerStatusController.js";
import AmbiguousInputError from "../structures/AmbiguousInputError.js";

import Command from "./Command.js";

class Buy extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {InventoryController} inventoryController
   * @param {ServerStatusController} serverStatusController
   */
  constructor(message, currencyController, inventoryController, serverStatusController) {
    super(message);
    this.currencyController = currencyController;
    this.inventoryController = inventoryController;
    this.serverStatusController = serverStatusController;
  }

  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.message.channel.watchSend(`Usage: !Buy (Item Name)`);
    }

    // Match the closest item

    return this.inventoryController
      .getGuildItem(this.message.content)
      .then(async (item) => {
        if (!item) {
          return this.inputChannel.watchSend(`There are no items named "${this.message.content}"`);
        }
        this.inputChannel.watchSend(">>> " + item.name + " " + item.getDetails());

        if (!item.unlimitedQuantity && item.quantity === 0) {
          return this.inputChannel.watchSend(`This item is currently out of stock`);
        }

        const userCurrency = await this.currencyController.getCurrency(this.message.sender);

        if (userCurrency < item.price) {
          return this.inputChannel.watchSend(`You do not have enough money to buy this item`);
        }

        return this.currencyController
          .addCurrency(this.message.sender, -item.price)
          .then(() => this.inventoryController.userPurchase(item, this.message.sender))
          .then(() => this.inputChannel.watchSend("`Purchase complete`"))
          .then(() => this.serverStatusController.updateServerStatus());
      })
      .catch((error) => {
        if (error instanceof AmbiguousInputError) {
          return this.inputChannel.watchSend(
            `There is more than one item with that name. Did you mean ${error.message}?`
          );
        }
        throw error;
      });
  }
}

export default Buy;
