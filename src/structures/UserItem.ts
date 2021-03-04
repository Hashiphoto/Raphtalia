import CommandItem from "./CommandItem";
import Item from "./Item";
import RNumber from "./RNumber";
import dayjs from "dayjs";

export default class UserItem extends Item {
  public remainingUses: number;
  public datePurchased: Date;
  public itemDecayCoefficient: number;

  public constructor(
    id: string,
    name: string,
    maxUses: number,
    quantity: number,
    commands: CommandItem[],
    isStealProtected: boolean,
    remainingUses: number,
    datePurchased: Date,
    itemDecayCoefficient: number
  ) {
    super(id, name, maxUses, quantity, commands, isStealProtected);

    this.remainingUses = remainingUses;
    this.datePurchased = datePurchased;
    this.itemDecayCoefficient = itemDecayCoefficient;
  }

  public get integrity() {
    const hoursSincePurchase = Math.abs(
      dayjs.duration(dayjs().diff(dayjs(this.datePurchased))).asHours()
    );
    // Cap the decay at 90% after a week. The function will pass through this point on the graph
    if (hoursSincePurchase >= 168) {
      return 0.9;
    }
    return 1 - Math.pow(hoursSincePurchase, 1.4) / 13200;
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
      this.itemDecayCoefficient
    );
  }

  public getDetails() {
    const quantity = `Quantity: ${this.quantity}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : `${this.remainingUses}/${this.maxUses}`}\n`;
    const integrity = this.isStealProtected
      ? ""
      : `Integrity: ${RNumber.formatPercent(this.integrity)}\n`;

    return quantity + uses + integrity + this.getCommands();
  }
}
