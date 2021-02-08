import CommandItem from "./CommandItem";

export default class Item {
  public id: string;
  public name: string;
  public maxUses: number;
  public quantity: number;
  public commands: CommandItem[];
  public unlimitedUses: boolean;
  public unlimitedQuantity: boolean;

  public constructor(
    id: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[]
  ) {
    this.id = id;
    this.name = name;
    this.maxUses = maxUses;
    this.quantity = quantity;
    this.commands = commands;
    this.unlimitedUses = this.maxUses < 0;
    this.unlimitedQuantity = this.quantity < 0;
  }

  public printName() {
    return `**${this.name}**`;
  }

  public printMaxUses() {
    return this.unlimitedUses ? "∞" : this.maxUses;
  }

  public getCommands() {
    // TODO: Once the prefix is moved into the db, grab that instead
    return (
      "```fix\n" +
      this.commands.reduce((sum: string, value: { name: any }) => sum + `!${value.name}\n`, "") +
      "```"
    );
  }
}
