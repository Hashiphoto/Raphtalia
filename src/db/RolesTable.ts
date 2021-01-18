import DbRole from "../structures/DbRole.js";
import RoleContest from "../structures/RoleContest.js";
import RoleContestBid from "../structures/RoleContestBid.js";

class RolesTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
    this.contestSelect = "SELECT *, rc.id as contestId FROM role_contests rc ";
  }

  /**
   * @param {any} row
   * @returns {DbRole}
   */
  toRoleObject(row) {
    return new DbRole(row.role_id, row.member_limit, row.contest_id != null);
  }

  toRoleContest(row) {
    return new RoleContest(
      row.contestId,
      row.role_id,
      row.from_role_id,
      row.initiator_id,
      row.start_date
    );
  }

  /**
   * @param {String} roleId
   * @returns {Promise<DbRole>}
   */
  getSingle(roleId) {
    return this.pool
      .query(
        "SELECT *, r.id AS role_id, rc.id AS contest_id FROM roles r " +
          "LEFT JOIN role_contests rc ON r.id = rc.role_id OR r.id = rc.from_role_id " +
          "WHERE r.id=?",
        [roleId]
      )
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return new DbRole(roleId, -1);
        }
        return this.toRoleObject(rows[0]);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  /**
   * @param {String[]} roleIds
   * @returns {Promise<DbRole[]>}
   */
  getMulti(roleIds) {
    return this.pool
      .query("SELECT * FROM roles WHERE id IN (?)", [roleIds])
      .then(([rows, fields]) => {
        return rows.map((r) => this.toRoleObject(r));
      })
      .catch((error) => console.error(error));
  }

  /**
   * @param {String} roleId
   * @param {String} fromRoleId
   * @param {String} initiatorId
   * @param {Date} startDate
   * @returns {Promise<boolean>} Returns whether a row was inserted or not
   */
  insertRoleContest(roleId, fromRoleId, initiatorId, startDate) {
    return this.pool
      .query("INSERT IGNORE INTO roles (id) VALUES (?), (?)", [roleId, fromRoleId])
      .then(() =>
        this.pool.query(
          "INSERT INTO role_contests (role_id, from_role_id, initiator_id, start_date) VALUES (?,?,?,?)",
          [roleId, fromRoleId, initiatorId, startDate]
        )
      )
      .then(([result, fields]) => {
        return result.affectedRows > 0;
      });
  }

  /**
   * @param {String} roleId
   * @param {String} userId
   */
  findRoleContest(roleId = "", userId = "") {
    return this.pool
      .query(this.contestSelect + "WHERE role_id=? OR initiator_id=?", [roleId, userId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return null;
        }

        return this.toRoleContest(rows[0]);
      });
  }

  /**
   * @param {String} guildId
   * @returns {Promise<RoleContest[]>}
   */
  getAllContests(guildId) {
    return this.pool
      .query(this.contestSelect + "JOIN users u ON u.id = rc.initiator_id WHERE u.guild_id=?", [
        guildId,
      ])
      .then(async ([rows, fields]) => {
        const roleContests = rows.map((r) => this.toRoleContest(r));

        for (const contest of roleContests) {
          const bids = await this.getContestBids(contest.id);
          contest.bids = bids;
        }

        return roleContests;
      });
  }

  deleteContest(contestId) {
    return this.pool.query("DELETE FROM role_contests WHERE id=?", [contestId]);
  }

  /**
   * @param {Number} contestId
   * @returns {Promise<RoleContestBid[]>}
   */
  getContestBids(contestId) {
    return this.pool
      .query("SELECT * FROM role_contest_bids WHERE contest_id=?", [contestId])
      .then(([rows, fields]) =>
        rows.map((r) => new RoleContestBid(r.user_id, parseFloat(r.bid_amount)))
      );
  }

  /**
   * @param {String} contestId
   * @param {String} userId
   * @param {Number} amount
   */
  insertContestBid(contestId, userId, amount) {
    return this.pool.query(
      "INSERT INTO role_contest_bids VALUES (?,?,?) ON DUPLICATE KEY UPDATE bid_amount = bid_amount + VALUES(bid_amount)",
      [contestId, userId, amount]
    );
  }
}

export default RolesTable;
