import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import DbRole from "../structures/DbRole";
import Repository from "./Repository";
import RoleContest from "../structures/RoleContest";
import RoleContestBid from "../structures/RoleContestBid";

export default class RolesRepository extends Repository {
  private contestSelect: string = "SELECT *, rc.id as contestId FROM role_contests rc ";

  public getSingle(roleId: string) {
    return this.pool
      .query(
        "SELECT *, r.id AS role_id, rc.id AS contest_id FROM roles r " +
          "LEFT JOIN role_contests rc ON r.id = rc.role_id OR r.id = rc.from_role_id " +
          "WHERE r.id=?",
        [roleId]
      )
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return new DbRole(roleId, -1);
        }
        return this.toRoleObject(rows[0]);
      });
  }

  public getMulti(roleIds: string[]) {
    return this.pool
      .query("SELECT * FROM roles WHERE id IN (?)", [roleIds])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => this.toRoleObject(r));
      })
      .catch((error) => console.error(error));
  }

  public insertRoleContest(
    roleId: string,
    fromRoleId: string,
    initiatorId: string,
    startDate: Date,
    messageId: string
  ) {
    return this.pool
      .query("INSERT IGNORE INTO roles (id) VALUES (?), (?)", [roleId, fromRoleId])
      .then(() =>
        this.pool.query(
          "INSERT INTO role_contests (role_id, from_role_id, initiator_id, start_date, message_id) VALUES (?,?,?,?,?)",
          [roleId, fromRoleId, initiatorId, startDate, messageId]
        )
      )
      .then(([result, fields]: [ResultSetHeader, FieldPacket[]]) => {
        return result.affectedRows > 0;
      });
  }

  public async getRoleContest(roleContestId: number, getBids = false) {
    return this.pool
      .query(this.contestSelect + "WHERE rc.id = ?", [roleContestId])
      .then(async ([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }
        const contest = this.toRoleContest(rows[0]);
        if (getBids) {
          contest.bids = await this.getContestBids(contest.id);
        }
        return contest;
      });
  }

  public async findRoleContest(roleId = "", userId = "", getBids = false) {
    return this.pool
      .query(this.contestSelect + "WHERE role_id=? OR initiator_id=?", [roleId, userId])
      .then(async ([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        if (rows.length === 0) {
          return;
        }
        const contest = this.toRoleContest(rows[0]);
        if (getBids) {
          contest.bids = await this.getContestBids(contest.id);
        }
        return contest;
      });
  }

  public getAllContests(guildId: string) {
    return this.pool
      .query(this.contestSelect + "JOIN users u ON u.id = rc.initiator_id WHERE u.guild_id=?", [
        guildId,
      ])
      .then(async ([rows, fields]: [RowDataPacket[], FieldPacket[]]) => {
        const roleContests = rows.map((r) => this.toRoleContest(r));

        for (const contest of roleContests) {
          const bids = await this.getContestBids(contest.id);
          contest.bids = bids;
        }

        return roleContests;
      });
  }

  public deleteContest(contestId: number) {
    return this.pool.query("DELETE FROM role_contests WHERE id=?", [contestId]);
  }

  public getContestBids(contestId: number) {
    return this.pool
      .query("SELECT * FROM role_contest_bids WHERE contest_id=? ORDER BY bid_amount DESC", [
        contestId,
      ])
      .then(([rows, fields]: [RowDataPacket[], FieldPacket[]]) =>
        rows.map((r) => new RoleContestBid(r.user_id, parseFloat(r.bid_amount)))
      );
  }

  public insertContestBid(contestId: number, userId: string, amount: number) {
    return this.pool.query(
      "INSERT INTO role_contest_bids VALUES (?,?,?) ON DUPLICATE KEY UPDATE bid_amount = bid_amount + VALUES(bid_amount)",
      [contestId, userId, amount]
    );
  }

  private toRoleObject(row: RowDataPacket) {
    return new DbRole(row.role_id, row.member_limit, row.contest_id != null);
  }

  private toRoleContest(row: RowDataPacket) {
    return new RoleContest(
      row.contestId,
      row.role_id,
      row.from_role_id,
      row.initiator_id,
      row.start_date,
      row.message_id
    );
  }
}
