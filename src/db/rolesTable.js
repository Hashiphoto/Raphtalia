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
    return new DbRole(row.id, row.member_limit);
  }

  /**
   * @param {String} roleId
   * @returns {Promise<DbRole>}
   */
  getSingle(roleId) {
    return this.pool
      .query("SELECT * FROM roles WHERE id = ?", [roleId])
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
}

export default RolesTable;
