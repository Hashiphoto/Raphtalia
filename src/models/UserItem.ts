import CommandItem from "./ItemCommand";
import GuildItem from "./GuildItem";
import dayjs from "dayjs";

export default class UserItem extends GuildItem {
  public remainingUses: number;
  public datePurchased: Date;
  public userId: string;
  public id: string;

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
    remainingUses: number,
    datePurchased: Date,
    userId: string,
    id: string
  ) {
    super(
      itemId,
      guildId,
      name,
      maxUses,
      quantity,
      isStealProtected,
      commands,
      price,
      maxQuantity,
      soldInCycle,
      dateLastSold
    );

    this.remainingUses = remainingUses;
    this.datePurchased = datePurchased;
    this.userId = userId;
    this.id = id;
  }

  public get stealDc(): number {
    const daysSincePurchase = Math.abs(
      dayjs.duration(dayjs().diff(dayjs(this.datePurchased))).asDays()
    );

    if (daysSincePurchase > 3) {
      return 19;
    }
    return 20;
  }

  /**
   * Returns a deep-copy of this item
   */
  public copy(): UserItem {
    return new UserItem(
      this.itemId,
      this.guildId,
      this.name,
      this.maxUses,
      this.quantity,
      this.isStealProtected,
      this.commands,
      this.price,
      this.maxQuantity,
      this.soldInCycle,
      this.dateLastSold,
      this.remainingUses,
      this.datePurchased,
      this.userId,
      this.id
    );
  }

  public getDetails(): string {
    const quantity = `Quantity: ${this.quantity}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : `${this.remainingUses}/${this.maxUses}`}\n`;

    return quantity + uses + this.printCommands();
  }
}
