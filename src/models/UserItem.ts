import dayjs, { Dayjs } from "dayjs";

import CommandItem from "./ItemCommand";
import GuildItem from "./GuildItem";

export default class UserItem extends GuildItem {
  public remainingUses: number;
  public datePurchased: Date;
  public userId: string;
  public id: string;
  public userQuantity: number;

  public constructor(
    itemId: string,
    guildId: string,
    name: string,
    maxUses: number,
    guildQuantity: number,
    isStealProtected: boolean,
    commands: CommandItem[],
    price: number,
    maxQuantity: number,
    soldInCycle: number,
    dateLastSold: Date,
    remainingUses: number,
    datePurchased: Date,
    userId: string,
    id: string,
    lifespanDays?: number
  ) {
    super(
      itemId,
      guildId,
      name,
      maxUses,
      guildQuantity,
      isStealProtected,
      commands,
      price,
      maxQuantity,
      soldInCycle,
      dateLastSold,
      lifespanDays
    );

    this.remainingUses = remainingUses;
    this.datePurchased = datePurchased;
    this.userId = userId;
    this.id = id;
    this.userQuantity = 1;
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

  public get expirationDate(): Dayjs | undefined {
    if (!this.lifespanDays) {
      return undefined;
    }
    const expirationDay = dayjs(this.datePurchased).add(this.lifespanDays, "day");
    const expirationMoment = expirationDay
      .set("hour", 8)
      .set("minute", 0)
      .set("second", 0)
      .set("millisecond", 0);
    return expirationDay.isBefore(expirationMoment)
      ? expirationMoment
      : expirationMoment.add(1, "day");
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
      this.id,
      this.lifespanDays
    );
  }

  public getDetails(additional = ""): string {
    const quantity = `Quantity: ${this.userQuantity}\n`;
    const uses = `Uses: ${this.unlimitedUses ? "∞" : `${this.remainingUses}/${this.maxUses}`}\n`;

    return quantity + uses + additional + this.printCommands();
  }
}
