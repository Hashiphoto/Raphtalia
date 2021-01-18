class Item {
  constructor(id, name, maxUses, quantity, commands) {
    this.id = id;
    this.name = name;
    this.maxUses = maxUses;
    this.quantity = quantity;
    this.commands = commands;
    this.unlimitedUses = this.maxUses < 0;
    this.unlimitedQuantity = this.quantity < 0;
  }

  printName() {
    return `**${this.name}**`;
  }

  printMaxUses() {
    return this.unlimitedUses ? "∞" : this.maxUses;
  }

  getCommands() {
    // TODO: Once the prefix is moved into the db, grab that instead
    return "```fix\n" + this.commands.reduce((sum, value) => sum + `!${value.name}\n`, "") + "```";
  }
}

export default Item;
