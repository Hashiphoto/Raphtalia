class DbGuild {
  /**
   *
   * @param {String} id
   * @param {Boolean} censorshipEnabled
   * @param {Number} taxRate
   * @param {String} roleMessageId
   * @param {String} storeMessageId
   * @param {String} banListMessageId
   * @param {Number} messageRate
   * @param {Number} messageResetTime
   * @param {Number} reactorRate
   * @param {Number} reacteeRate
   * @param {Number} priceHikeCoefficient
   * @param {Number} priceDropDays
   * @param {Number} priceDropRate
   */
  constructor(
    id,
    censorshipEnabled,
    taxRate,
    roleMessageId,
    storeMessageId,
    banListMessageId,
    messageRate,
    messageResetTime,
    reactorRate,
    reacteeRate,
    priceHikeCoefficient,
    priceDropDays,
    priceDropRate
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

export default DbGuild;
