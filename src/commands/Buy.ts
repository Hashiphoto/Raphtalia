import AmbiguousInputError from "../structures/errors/AmbiguousInputError.js";
import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import Discord from "discord.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import RNumber from "../structures/RNumber.js";
import StoreStatusController from "../controllers/message/StoreStatusController.js";

export default class Buy extends Command {
  constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Buy**\nPurchase an item from the server store. The item will be added to your inventory, if there is adequate quantity in the store";
    this.usage = "Usage: `Buy (item name)`";
  }

  async execute(): Promise<any> {
    if (!this.ec.messageHelper.args || this.ec.messageHelper.args.length === 0) {
      return this.sendHelpMessage();
    }

    const item = await this.ec.inventoryController.getGuildItem(
      this.ec.messageHelper.parsedContent
    );
    // .catch((error) => {
    //   if (error instanceof AmbiguousInputError) {
    //     return this.ec.channelHelper.watchSend(
    //       `There is more than one item with that name. Did you mean ${error.message}?`
    //     );
    //   }
    //   throw error;
    // });

    if (!item) {
      return this.ec.channelHelper.watchSend(
        `There are no items named "${this.ec.messageHelper.parsedContent}"`
      );
    }

    if (!item.unlimitedQuantity && item.quantity === 0) {
      return this.ec.channelHelper.watchSend(`${item.printName()} is currently out of stock`);
    }

    const userCurrency = await this.ec.currencyController.getCurrency(this.ec.initiator);

    if (userCurrency < item.price) {
      return this.ec.channelHelper.watchSend(`You do not have enough money to buy this item`);
    }

    return this.ec.currencyController
      .transferCurrency(this.ec.initiator, this.ec.raphtaliaMember, item.price)
      .then(() => this.ec.inventoryController.userPurchase(item, this.ec.initiator))
      .then(() =>
        this.ec.channelHelper.watchSend(
          `Thank you for your purchase of ${RNumber.formatDollar(
            item.price
          )}!\n>>> ${item.printName()} | Uses: ${item.printMaxUses()}`
        )
      )
      .then(() => this.useItem())
      .then(() => this.ec.storeStatusController.update());
  }
}
