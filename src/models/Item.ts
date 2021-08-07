import CommandItem from "./ItemCommand";

export default class Item {
  public id: string;
  public guildId: string;
  public name: string;
  public maxUses: number;
  public quantity: number;
  public unlimitedUses: boolean;
  public unlimitedQuantity: boolean;
  public isStealProtected: boolean;

  private _commands: CommandItem[] | undefined;

  public constructor(
    id: string,
    guildId: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[] | undefined,
    isStealProtected: boolean
  ) {
    this.id = id;
    this.guildId = guildId;
    this.name = name;
    this.maxUses = maxUses;
    this.quantity = quantity;
    this._commands = commands;
    this.unlimitedUses = this.maxUses < 0;
    this.unlimitedQuantity = this.quantity < 0;
    this.isStealProtected = isStealProtected;
  }

  public async getCommands(): Promise<CommandItem[]> {
    if (!this._commands) {
      this._commands = await this.itemRepository.getCommandsForItem(this.id);
    }
    return this._commands;
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

  public async printCommands(): Promise<string> {
    const commands = await this.getCommands();
    if (commands.length === 0) {
      return "```\nVanity Item\n```";
    }
    return (
      "```fix\n" +
      commands.reduce((sum: string, value: { name: any }) => sum + `!${value.name}\n`, "") +
      "```"
    );
  }
}
