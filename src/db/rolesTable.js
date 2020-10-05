import mysqlPromise from "mysql2/promise.js";
import DbRole from "../structures/DbRole.js";

class RolesTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * @param {any} row
   * @returns {DbRole}
   */
  toRoleObject(row) {
    return new DbRole(row.role_id, row.member_limit, row.contest_id != null);
  }

  /**
   * @param {String} roleId
   * @returns {Promise<DbRole>}
   */
  getSingle(roleId) {
    return this.pool
      .query(
        "SELECT *, r.id AS role_id, rc.id AS contest_id FROM roles r " +
          "LEFT JOIN role_contests rc ON r.id = rc.role_id " +
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
   * @param {Date} startDate
   * @returns {Promise<boolean>} Returns whether a row was inserted or not
   */
  insertRoleContest(roleId, fromRoleId, startDate) {
    return this.pool
      .query("INSERT IGNORE INTO roles (id) VALUES (?), (?)", [roleId, fromRoleId])
      .then(() =>
        this.pool.query(
          "INSERT INTO role_contests (role_id, from_role_id, start_date) VALUES (?,?,?)",
          [roleId, fromRoleId, startDate]
        )
      )
      .then(([result, fields]) => {
        return result.affectedRows > 0;
      });
  }
}

export default RolesTable;
