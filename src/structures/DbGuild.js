class DbGuild {
  constructor(censorshipEnabled, censorRegex, taxRate, roleMessageId, storeMessageId, messageRate) {
    this.censorshipEnabled = censorshipEnabled;
    this.censorRegex = censorRegex;
    this.taxRate = taxRate;
    this.roleMessageId = roleMessageId;
    this.storeMessageId = storeMessageId;
    this.messageRate = messageRate;
  }
}

export default DbGuild;
