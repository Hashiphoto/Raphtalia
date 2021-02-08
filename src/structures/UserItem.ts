import CommandItem from "./CommandItem";
import Item from "./Item";

export default class UserItem extends Item {
  public remainingUses: number;

  public constructor(
    id: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[],
    remainingUses: number
  ) {
    super(id, name, maxUses, quantity, commands);

    this.remainingUses = remainingUses;
  }

  /**
   * Returns a deep-copied clone of this item
   */
  public copy() {
    return new UserItem(
      this.id,
      this.name,
      this.maxUses,
      this.quantity,
      this.commands,
      this.remainingUses
    );
  }

  public getDetails() {
    const uses = `Uses: ${this.unlimitedUses ? "∞" : `${this.remainingUses}/${this.maxUses}\n`}`;
    const quantity = `Quantity: ${this.quantity}\n`;

    return quantity + uses + this.getCommands();
  }
}
