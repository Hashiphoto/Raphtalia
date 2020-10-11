import Discord from "discord.js";
import CurrencyController from "../controllers/CurrencyController.js";
import StoreStatusController from "../controllers/message/StoreStatusController.js";
import AmbiguousInputError from "../structures/errors/AmbiguousInputError.js";
import RNumber from "../structures/RNumber.js";
import Command from "./Command.js";

class Buy extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   * @param {StoreStatusController} storeStatusCtlr
   * @param {Discord.Client} client
   */
  constructor(message, currencyController, storeStatusCtlr, client) {
    super(message);
    this.currencyController = currencyController;
    this.storeStatusCtlr = storeStatusCtlr;
    this.client = client;
    this.instructions =
      "**Buy**\nPurchase an item from the server store. The item will be added to your inventory, if there is adequate quantity in the store";
    this.usage = "Usage: `Buy (item name)`";
  }

  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    return this.inventoryController
      .getGuildItem(this.message.content)
      .then(async (item) => {
        if (!item) {
          return this.inputChannel.watchSend(`There are no items named "${this.message.content}"`);
        }

        if (!item.unlimitedQuantity && item.quantity === 0) {
          return this.inputChannel.watchSend(`${item.printName()} is currently out of stock`);
        }

        const userCurrency = await this.currencyController.getCurrency(this.message.sender);

        if (userCurrency < item.price) {
          return this.inputChannel.watchSend(`You do not have enough money to buy this item`);
        }

        return this.currencyController
          .transferCurrency(this.message.member, this.client.user, item.price)
          .then(() => this.inventoryController.userPurchase(item, this.message.sender))
          .then(() =>
            this.inputChannel.watchSend(
              `Thank you for your purchase of ${RNumber.formatDollar(
                item.price
              )}!\n>>> ${item.printName()} | Uses: ${item.printMaxUses()}`
            )
          )
          .then(() => this.storeStatusCtlr.update())
          .then(() => this.useItem())
          .then(() => true);
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
