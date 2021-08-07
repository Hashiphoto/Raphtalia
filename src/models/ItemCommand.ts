export default class CommandItem {
  public id: number;
  public name: string;
  public itemId: number;

  public constructor(id: number, name: string, itemId: number) {
    this.id = id;
    this.name = name;
    this.itemId = itemId;
  }
}
