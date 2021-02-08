import { GuildMember } from "discord.js";
import RoleContestBid from "./RoleContestBid";

export default class RoleContest {
  public id: number;
  public roleId: string;
  public subRoleId: string;
  public initiatorId: string;
  public startDate: Date;
  public bids: RoleContestBid[];
  public messageId: string;

  public constructor(
    id: number,
    roleId: string,
    subRoleId: string,
    initiatorId: string,
    startDate: Date,
    messageId: string
  ) {
    this.id = id;
    this.roleId = roleId;
    this.subRoleId = subRoleId;
    this.initiatorId = initiatorId;
    this.startDate = startDate;
    this.bids;
    this.messageId = messageId;
  }

  public getLowestBid(members?: GuildMember[]) {
    if (!members) {
      if (this.bids.length === 0) {
        return;
      }

      return this.bids[0];
    }

    // Match member objects to their bids
    for (const member of members) {
      let bid = this.bids.find((b) => b.userId === member.id);
      if (!bid) {
        bid = new RoleContestBid(member.id, 0);
        this.bids.push(bid);
      }

      bid.member = member;
    }

    // Get the loser
    this.bids.sort((a, b) => a.amount - b.amount);

    return this.bids[0];
  }
}
