class BadParametersError extends Error {
  constructor(...params) {
    super(...params);

    this.name = "BadParametersError";
  }
}

export default BadParametersError;
