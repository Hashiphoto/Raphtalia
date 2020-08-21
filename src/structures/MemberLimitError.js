class MemberLimitError extends Error {
  constructor(roleMemberLimit, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Rerror);
    }

    this.name = "MemberLimitError";
    this.roleMemberLimit = roleMemberLimit;
  }
}

export default MemberLimitError;
