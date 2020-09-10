class AuthorityError extends Error {
  constructor(higherMemberName, ...params) {
    super(...params);

    this.name = "AuthorityError";
    this.higherMemberName = higherMemberName;
  }
}

export default AuthorityError;
