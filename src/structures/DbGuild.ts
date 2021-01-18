class DbGuild {
  id: String;
  censorshipEnabled: Boolean;
  taxRate: Number;
  roleMessageId: String;
  storeMessageId: String;
  banListMessageId: String;
  messageRate: Number;
  messageResetTime: Number;
  reactorRate: Number;
  reacteeRate: Number;
  priceHikeCoefficient: Number;
  priceDropDays: Number;
  priceDropRate: Number;

  constructor(
    id: String,
    censorshipEnabled: Boolean,
    taxRate: Number,
    roleMessageId: String,
    storeMessageId: String,
    banListMessageId: String,
    messageRate: Number,
    messageResetTime: Number,
    reactorRate: Number,
    reacteeRate: Number,
    priceHikeCoefficient: Number,
    priceDropDays: Number,
    priceDropRate: Number
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
  }
}

module.exports = DbGuild;
