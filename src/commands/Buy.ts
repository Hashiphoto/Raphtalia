import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import RNumber from "../structures/RNumber";

export default class Buy extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Buy**\nPurchase an item from the server store. The item will be added to your inventory, if there is adequate quantity in the store";
    this.usage = "Usage: `Buy (item name)`";
  }

  public async execute(): Promise<any> {
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
      .transferCurrency(this.ec.initiator, this.ec.raphtalia, item.price)
      .then(() => this.ec.inventoryController.userPurchase(item, this.ec.initiator))
      .then(() =>
        this.ec.channelHelper.watchSend(
          `Thank you for your purchase of ${RNumber.formatDollar(
            item.price
          )}!\n>>> ${item.printName()} | Uses: ${item.printMaxUses()}`
        )
      )
      .then(() => this.useItem(1, true));
  }
}
