class AuthorityError extends Error {
  constructor(...params) {
    super(...params);

    this.name = "AuthorityError";
  }
}

export default AuthorityError;
