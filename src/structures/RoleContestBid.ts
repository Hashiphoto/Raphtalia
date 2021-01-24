export default class RoleContestBid {
  public userId: string;
  public amount: number;
  public member: any;

  /**
   * @param {String} userId
   * @param {Number} amount
   */
  public constructor(userId: string, amount: number) {
    this.userId = userId;
    this.amount = amount;
  }
}
