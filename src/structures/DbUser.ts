class DbUser {
  /**
   * @param {String} id
   * @param {String} guildId
   * @param {Number} infractions
   * @param {Number} currency
   * @param {Boolean} citizenship
   * @param {Number} bonusIncome
   * @param {Date} lastMessageDate
   */
  constructor(id, guildId, infractions, currency, citizenship, bonusIncome, lastMessageDate) {
    this.id = id;
    this.guildId = guildId;
    this.infractions = infractions;
    this.currency = currency;
    this.isCitizen = citizenship;
    this.bonusIncome = bonusIncome;
    this.lastMessageDate = lastMessageDate;
  }
}

export default DbUser;
