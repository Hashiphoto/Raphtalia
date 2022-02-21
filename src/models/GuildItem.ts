import { Format, print } from "../utilities/Util";
import CommandItem from "./ItemCommand";

export default class GuildItem {
  public itemId: string;
  public guildId: string;
  public name: string;
  public maxUses: number;
  public quantity: number;
  public unlimitedUses: boolean;
  public unlimitedQuantity: boolean;
  public isStealProtected: boolean;
  public commands: CommandItem[];
  public price: number;
  public maxQuantity: number;
  public soldInCycle: number;
  public dateLastSold: Date;
  public lifespanDays?: number;

  public constructor(
    itemId: string,
    guildId: string,
    name: string,
    maxUses: number,
    quantity: number,
    isStealProtected: boolean,
    commands: CommandItem[],
    price: number,
    maxQuantity: number,
    soldInCycle: number,
    dateLastSold: Date,
    lifespanDays?: number
  ) {
    this.itemId = itemId;
    this.guildId = guildId;
    this.name = name;
    this.maxUses = maxUses;
    this.quantity = quantity;
    this.isStealProtected = isStealProtected;
    this.commands = commands;
    this.price = price;
    this.maxQuantity = maxQuantity;
    this.soldInCycle = soldInCycle;
    this.dateLastSold = dateLastSold;
    this.lifespanDays = lifespanDays;

    this.unlimitedUses = this.maxUses < 0;
    this.unlimitedQuantity = this.quantity < 0 || this.maxQuantity < 0;
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
      return "```\nNo Commands\n```";
    }
    return (
      "```fix\n" +
      this.commands.reduce((sum: string, value: { name: string }) => sum + `!${value.name}\n`, "") +
      "```"
    );
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
