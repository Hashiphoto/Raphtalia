class DbGuild {
  constructor(
    id,
    censorshipEnabled,
    censorRegex,
    taxRate,
    roleMessageId,
    storeMessageId,
    messageRate,
    messageResetTime
  ) {
    this.id = id;
    this.censorshipEnabled = censorshipEnabled;
    this.censorRegex = censorRegex;
    this.taxRate = taxRate;
    this.roleMessageId = roleMessageId;
    this.storeMessageId = storeMessageId;
    this.messageRate = messageRate;
    this.messageResetTime = messageResetTime;
  }
}

export default DbGuild;
