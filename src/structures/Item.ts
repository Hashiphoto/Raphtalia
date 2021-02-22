import CommandItem from "./CommandItem";

export default class Item {
  public id: string;
  public name: string;
  public maxUses: number;
  public quantity: number;
  public commands: CommandItem[];
  public unlimitedUses: boolean;
  public unlimitedQuantity: boolean;
  public isStealProtected: boolean;

  public constructor(
    id: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[],
    isStealProtected: boolean
  ) {
    this.id = id;
    this.name = name;
    this.maxUses = maxUses;
    this.quantity = quantity;
    this.commands = commands;
    this.unlimitedUses = this.maxUses < 0;
    this.unlimitedQuantity = this.quantity < 0;
    this.isStealProtected = isStealProtected;
  }

  public printName() {
    return `**${this.name}**`;
  }

  public getFormattedName() {
    return `${this.isStealProtected ? "🔒" : ""} ${this.name}`;
  }

  public printMaxUses() {
    return this.unlimitedUses ? "∞" : this.maxUses;
  }

  public getCommands() {
    // TODO: Once the prefix is moved into the db, grab that instead
    if (this.commands.length === 0) {
      return "```\nVanity Item\n```";
    }
    return (
      "```fix\n" +
      this.commands.reduce((sum: string, value: { name: any }) => sum + `!${value.name}\n`, "") +
      "```"
    );
  }
}
