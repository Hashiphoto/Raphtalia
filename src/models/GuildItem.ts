import { Format, print } from "../utilities/Util";

import CommandItem from "./ItemCommand";
import Item from "./Item";

export default class GuildItem extends Item {
  public price: number;
  public maxQuantity: number;
  public soldInCycle: number;
  public dateLastSold: Date;

  public constructor(
    id: string,
    guildId: string,
    name: string,
    maxUses: number,
    quantity: number,
    isStealProtected: boolean,
    commands: CommandItem[],
    price: number,
    maxQuantity: number,
    soldInCycle: number,
    dateLastSold: Date
  ) {
    super(id, guildId, name, maxUses, quantity, isStealProtected, commands);

    // override logic
    this.unlimitedQuantity = this.quantity < 0 || this.maxQuantity < 0;

    this.price = price;
    this.maxQuantity = maxQuantity;
    this.soldInCycle = soldInCycle;
    this.dateLastSold = dateLastSold;
  }

  public inStock(): boolean {
    return this.unlimitedQuantity || this.quantity > 0;
  }

  public printPrice(): string {
    return print(this.price, Format.Dollar);
  }

  public getDetails(): string {
    const price = `Price: ${print(this.price, Format.Dollar)}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : this.maxUses}\n`;
    const quantity = `Quantity: ${
      this.unlimitedQuantity ? "∞" : `${this.quantity}/${this.maxQuantity}`
    }\n`;

    return price + uses + quantity + this.printCommands();
  }
}
