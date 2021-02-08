import { GuildMember } from "discord.js";

export default class RoleContestBid {
  public userId: string;
  public amount: number;
  public member: GuildMember;

  public constructor(userId: string, amount: number) {
    this.userId = userId;
    this.amount = amount;
  }
}
