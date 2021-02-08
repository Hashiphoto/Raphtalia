import CommandItem from "./CommandItem";
import Item from "./Item";
import RNumber from "./RNumber";

export default class GuildItem extends Item {
  public price: number;
  public maxQuantity: number;
  public soldInCycle: number;
  public dateLastSold: Date;

  public constructor(
    id: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[],
    price: number,
    maxQuantity: number,
    soldInCycle: number,
    dateLastSold: Date
  ) {
    super(id, name, maxUses, quantity, commands);

    this.price = price;
    this.maxQuantity = maxQuantity;
    this.soldInCycle = soldInCycle;
    this.dateLastSold = dateLastSold;
  }

  public getDetails() {
    const price = `Price: ${RNumber.formatDollar(this.price)}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : this.maxUses}\n`;
    const quantity =
      `Quantity: ` + (this.unlimitedQuantity ? "∞" : `${this.quantity}/${this.maxQuantity}`) + `\n`;

    return price + uses + quantity + this.getCommands();
  }
}
