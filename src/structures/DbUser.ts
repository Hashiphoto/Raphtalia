export default class DbUser {
  public id: string;
  public guildId: string;
  public infractions: number;
  public currency: number;
  public isCitizen: boolean;
  public bonusIncome: number;
  public lastMessageDate: Date;

  public constructor(
    id: string,
    guildId: string,
    infractions: number,
    currency: number,
    citizenship: boolean,
    bonusIncome: number,
    lastMessageDate: Date
  ) {
    this.id = id;
    this.guildId = guildId;
    this.infractions = infractions;
    this.currency = currency;
    this.isCitizen = citizenship;
    this.bonusIncome = bonusIncome;
    this.lastMessageDate = lastMessageDate;
  }
}
