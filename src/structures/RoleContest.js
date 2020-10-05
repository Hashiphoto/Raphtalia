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
  }
}

export default RoleContest;
