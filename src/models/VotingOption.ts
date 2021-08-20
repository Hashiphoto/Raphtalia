import { Format, print } from "../utilities/Util";

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

  public toString(): string {
    return `${this.id}. ${this.body}\n`;
  }

  public getPercentage(): string {
    return `${print(this.totalVotes === 0 ? 0 : this.votes / this.totalVotes, Format.Percent)}`;
  }
}
