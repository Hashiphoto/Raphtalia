import RNumber from "./RNumber.js";

class Item {
  constructor(id, name, price, startingUses, quantity, maxQuantity, commands) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.startingUses = startingUses;
    this.quantity = quantity;
    this.maxQuantity = maxQuantity;
    this.commands = commands;
    this.unlimitedQuantity = this.maxQuantity < 0;
    this.unlimitedUses = this.startingUses < 0;
  }

  toString() {
    const price = `Price: ${RNumber.formatDollar(this.price)}\n`;
    const quantity =
      `Quantity: ` + (this.unlimitedQuantity ? "∞" : `${this.quantity}/${this.maxQuantity}`) + `\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : this.startingUses}\n`;
    // TODO: Once the prefix is moved into the db, grab that instead
    const commands = this.commands.reduce((sum, value) => sum + `!${value.name}\n`, "");

    return price + uses + quantity + "```fix\n" + commands + "```";
  }
}

export default Item;
