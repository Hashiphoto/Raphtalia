class CommandItem {
  public id: number;
  public name: string;
  public itemId: number;
  public itemName: string;

  public constructor(id: number, name: string, itemId: number, itemName: string) {
    this.id = id;
    this.name = name;
    this.itemId = itemId;
    this.itemName = itemName;
  }
}

export default CommandItem;
