class DbRole {
  /**
   * @param {String} id
   * @param {Number} memberLimit
   * @param {Boolean} contested
   */
  constructor(id, memberLimit, contested) {
    this.id = id;
    this.memberLimit = memberLimit;
    this.unlimited = memberLimit < 0;
    this.contested = contested;
  }
}

export default DbRole;
