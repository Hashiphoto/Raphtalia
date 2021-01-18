import RNumber from "./RNumber.js";

class VotingOption {
  /**
   * @param {Number} id
   * @param {String} body
   */
  constructor(id, body) {
    this.id = id;
    this.body = body;
    this.votes = 0;
    this.totalVotes;
  }

  toString() {
    return `${this.id}. ${this.body}\n`;
  }

  getPercentage() {
    if (this.totalVotes === 0) {
      return RNumber.formatPercent(0);
    }
    return `${RNumber.formatPercent(this.votes / this.totalVotes)}`;
  }
}

export default VotingOption;
