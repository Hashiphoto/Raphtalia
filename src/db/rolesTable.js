import mysqlPromise from "mysql2/promise.js";

class RolesTable {
  /**
   *
   * @param {mysqlPromise.PromisePool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  getSingle(roleId) {
    return this.pool
      .query("SELECT * FROM roles WHERE id = ?", [roleId])
      .then(([rows, fields]) => {
        if (rows.length === 0) {
          return { id: roleId, income: 0, price: 0 };
        }
        return rows[0];
      })
      .catch((e) => {
        console.error(e);
      });
  }

  getMulti(roleIds) {
    return this.pool
      .query("SELECT * FROM roles WHERE id IN (?)", [roleIds])
      .then(([rows, fields]) => {
        return rows;
      })
      .catch((error) => console.error(error));
  }

  setRoleIncome(roleId, income) {
    return this.pool
      .query(
        "INSERT INTO roles (id, income) VALUES (?,?) ON DUPLICATE KEY UPDATE income = VALUES(income)",
        [roleId, income]
      )
      .catch((error) => console.error(error));
  }

  setRolePrice(roleId, price) {
    return this.pool
      .query(
        "INSERT INTO roles (id, price) VALUES (?,?) ON DUPLICATE KEY UPDATE price = VALUES(price)",
        [roleId, price]
      )
      .catch((error) => console.error(error));
  }
}

export default RolesTable;
