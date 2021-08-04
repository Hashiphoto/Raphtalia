import CommandItem from "./CommandItem";
import Item from "./Item";
import dayjs from "dayjs";

export default class UserItem extends Item {
  public remainingUses: number;
  public datePurchased: Date;
  public userId: string;

  public constructor(
    id: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[],
    isStealProtected: boolean,
    remainingUses: number,
    datePurchased: Date,
    userId: string
  ) {
    super(id, name, maxUses, quantity, commands, isStealProtected);

    this.remainingUses = remainingUses;
    this.datePurchased = datePurchased;
    this.userId = userId;
  }

  public get stealDc() {
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
  public copy() {
    return new UserItem(
      this.id,
      this.name,
      this.maxUses,
      this.quantity,
      this.commands,
      this.isStealProtected,
      this.remainingUses,
      this.datePurchased,
      this.userId
    );
  }

  public getDetails() {
    const quantity = `Quantity: ${this.quantity}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : `${this.remainingUses}/${this.maxUses}`}\n`;

    return quantity + uses + this.getCommands();
  }
}
