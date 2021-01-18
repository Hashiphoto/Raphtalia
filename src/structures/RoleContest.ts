import Discord from "discord.js";
import RoleContestBid from "./RoleContestBid.js";

class RoleContest {
  /**
   * @param {Number} id
   * @param {String} roleId
   * @param {String} subRoleId
   * @param {String} initiatorId
   * @param {Date} startDate
   */
  constructor(id, roleId, subRoleId, initiatorId, startDate) {
    this.id = id;
    this.roleId = roleId;
    this.subRoleId = subRoleId;
    this.initiatorId = initiatorId;
    this.startDate = startDate;
    this._bids;
  }

  get bids() {
    return this._bids;
  }

  /**
   * @param {RoleContestBid[]} bids
   */
  set bids(bids) {
    this._bids = bids;
  }

  getLoser() {
    if (!this._bids || this._bids.length === 0) {
      return null;
    }

    return this._bids[0];
  }

  /**
   * @param {Discord.GuildMember[]} members
   */
  getLoser(members) {
    // Match member objects to their bids
    for (const member of members) {
      let bid = this._bids.find((b) => b.userId === member.id);
      if (!bid) {
        bid = new RoleContestBid(member.id, 0);
        this._bids.push(bid);
      }

      bid.member = member;
    }

    // Get the loser
    this._bids.sort((a, b) => a.amount - b.amount);

    return this._bids[0];
  }
}

export default RoleContest;
