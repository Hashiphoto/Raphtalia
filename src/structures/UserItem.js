import Item from "./Item.js";

class UserItem extends Item {
  constructor(id, name, maxUses, quantity, commands, remainingUses) {
    super(id, name, maxUses, quantity, commands);

    this.remainingUses = remainingUses;
  }

  getDetails() {
    const uses = `Uses: ${this.unlimitedUses ? "∞" : `${this.remainingUses}/${this.maxUses}\n`}`;
    const quantity = `Quantity: ${this.quantity}\n`;

    return quantity + uses + this.getCommands();
  }
}

export default UserItem;
