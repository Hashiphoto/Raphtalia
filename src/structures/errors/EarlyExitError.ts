class EarlyExitError extends Error {
  constructor(...params) {
    super(...params);

    this.name = "EarlyExitError";
  }
}

export default EarlyExitError;
