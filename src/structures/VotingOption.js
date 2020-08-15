import { percentFormat } from "../util/format.js";

class VotingOption {
  id;
  body;
  votes;
  totalVotes;

  constructor(id, body) {
    this.id = id;
    this.body = body;
    this.votes = 0;
  }

  toString() {
    return `${this.id}. ${this.body}\n`;
  }

  getPercentage() {
    if (this.totalVotes === 0) {
      return percentFormat(0) + "%";
    }
    return `${percentFormat(this.votes / this.totalVotes)}%`;
  }
}

export default VotingOption;
