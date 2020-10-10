class MemberLimitError extends Error {
  constructor(roleMemberLimit, ...params) {
    super(...params);

    this.name = "MemberLimitError";
    this.roleMemberLimit = roleMemberLimit;
  }
}

export default MemberLimitError;
