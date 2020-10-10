class RoleContestBid {
  /**
   * @param {String} userId
   * @param {Number} amount
   */
  constructor(userId, amount) {
    this.userId = userId;
    this.amount = amount;
    this._member;
  }

  get member() {
    return this._member;
  }

  set member(member) {
    this._member = member;
  }
}

export default RoleContestBid;
