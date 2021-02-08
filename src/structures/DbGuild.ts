export default class DbGuild {
  public id: string;
  public censorshipEnabled: boolean;
  public taxRate: number;
  public roleMessageId: string;
  public storeMessageId: string;
  public banListMessageId: string;
  public messageRate: number;
  public messageResetTime: number;
  public reactorRate: number;
  public reacteeRate: number;
  public priceHikeCoefficient: number;
  public priceDropDays: number;
  public priceDropRate: number;
  public outputChannelId?: string;

  public constructor(
    id: string,
    censorshipEnabled: boolean,
    taxRate: number,
    roleMessageId: string,
    storeMessageId: string,
    banListMessageId: string,
    messageRate: number,
    messageResetTime: number,
    reactorRate: number,
    reacteeRate: number,
    priceHikeCoefficient: number,
    priceDropDays: number,
    priceDropRate: number,
    outputChannelId: string
  ) {
    this.id = id;
    this.censorshipEnabled = censorshipEnabled;
    this.taxRate = taxRate;
    this.roleMessageId = roleMessageId;
    this.storeMessageId = storeMessageId;
    this.banListMessageId = banListMessageId;
    this.messageRate = messageRate;
    this.messageResetTime = messageResetTime;
    this.reactorRate = reactorRate;
    this.reacteeRate = reacteeRate;
    this.priceHikeCoefficient = priceHikeCoefficient;
    this.priceDropDays = priceDropDays;
    this.priceDropRate = priceDropRate;
    this.outputChannelId = outputChannelId;
  }
}
