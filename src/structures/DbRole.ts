export default class DbRole {
  public id: string;
  public memberLimit: number;
  public unlimited: boolean;
  public contested: boolean;

  public constructor(id: string, memberLimit: number, contested: boolean = false) {
    this.id = id;
    this.memberLimit = memberLimit;
    this.unlimited = memberLimit < 0;
    this.contested = contested;
  }
}
