import RNumber from "./RNumber.js";

export default class VotingOption {
  public id: number;
  public body: string;
  public votes: number;
  public totalVotes: number;

  public constructor(id: number, body: string) {
    this.id = id;
    this.body = body;
    this.votes = 0;
  }

  public toString() {
    return `${this.id}. ${this.body}\n`;
  }

  public getPercentage() {
    if (this.totalVotes === 0) {
      return RNumber.formatPercent(0);
    }
    return `${RNumber.formatPercent(this.votes / this.totalVotes)}`;
  }
}
