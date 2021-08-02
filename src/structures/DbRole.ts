import dayjs, { Dayjs } from "dayjs";

export default class DbRole {
  public id: string;
  public memberLimit: number;
  public unlimited: boolean;
  public contested: boolean;
  public lastPromotionOn: Dayjs | undefined;

  public constructor(id: string, memberLimit: number, contested = false, lastPromotionOn?: Date) {
    this.id = id;
    this.memberLimit = memberLimit;
    this.unlimited = memberLimit < 0;
    this.contested = contested;
    this.lastPromotionOn = lastPromotionOn ? dayjs(lastPromotionOn) : undefined;
  }
}
