import ExecutionContext from "../structures/ExecutionContext";
import UserItem from "../structures/UserItem";

export default class Command {
  public item: UserItem;
  public instructions: string;

  protected ec: ExecutionContext;
  protected usage: string;

  public constructor(context: ExecutionContext) {
    this.ec = context;
  }

  public async execute(): Promise<any> {
    throw new Error("Implement this function");
  }

  public async sendHelpMessage(pretext = "") {
    return this.ec.channelHelper.watchSend(pretext + "\n" + this.usage);
  }

  /**
   * @param {Number} uses
   * @returns {Boolean} Whether the store needs to be updated or not
   */
  public useItem(uses = 1, forceUpdate = false) {
    const oldQuantity = this.item.quantity;
    return this.ec.inventoryController
      .useItem(this.item, this.ec.initiator, uses)
      .then((newItem) => {
        if (newItem && newItem.quantity < oldQuantity) {
          return this.ec.channelHelper
            .watchSend(
              `Your ${newItem.printName()} broke! You have ${newItem.quantity} remaining.\n`
            )
            .then(() => true);
        }
        return false;
      })
      .then((storeNeedsUpdate) => {
        if (storeNeedsUpdate || forceUpdate) {
          this.ec.storeStatusController.update();
        }
      });
  }

  public sum(total: string, value: string) {
    return total + value;
  }
}
