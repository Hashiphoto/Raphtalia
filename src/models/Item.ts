import CommandItem from "./ItemCommand";

export default class Item {
  public itemId: string;
  public guildId: string;
  public name: string;
  public maxUses: number;
  public quantity: number;
  public unlimitedUses: boolean;
  public unlimitedQuantity: boolean;
  public isStealProtected: boolean;
  public commands: CommandItem[];

  public constructor(
    itemId: string,
    guildId: string,
    name: string,
    maxUses: number,
    quantity: number,
    isStealProtected: boolean,
    commands: CommandItem[]
  ) {
    this.itemId = itemId;
    this.guildId = guildId;
    this.name = name;
    this.maxUses = maxUses;
    this.quantity = quantity;
    this.unlimitedUses = this.maxUses < 0;
    this.unlimitedQuantity = this.quantity < 0;
    this.isStealProtected = isStealProtected;
    this.commands = commands;
  }

  public printName(): string {
    return `**${this.name}**`;
  }

  public getFormattedName(): string {
    return `${this.isStealProtected ? "🔒" : ""} ${this.name}`;
  }

  public printMaxUses(): string {
    return this.unlimitedUses ? "∞" : String(this.maxUses);
  }

  public printCommands(): string {
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
