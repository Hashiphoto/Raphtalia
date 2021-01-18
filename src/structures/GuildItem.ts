import Item from "./Item.js";
import RNumber from "./RNumber.js";

class GuildItem extends Item {
  constructor(
    id,
    name,
    maxUses,
    quantity,
    commands,
    price,
    maxQuantity,
    soldInCycle,
    dateLastSold
  ) {
    super(id, name, maxUses, quantity, commands);

    this.price = price;
    this.maxQuantity = maxQuantity;
    this.soldInCycle = soldInCycle;
    this.dateLastSold = dateLastSold;
  }

  getDetails() {
    const price = `Price: ${RNumber.formatDollar(this.price)}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : this.maxUses}\n`;
    const quantity =
      `Quantity: ` + (this.unlimitedQuantity ? "∞" : `${this.quantity}/${this.maxQuantity}`) + `\n`;

    return price + uses + quantity + this.getCommands();
  }
}

export default GuildItem;
