export default class BadParametersError extends Error {
  constructor(...params: any) {
    super(...params);

    this.name = "BadParametersError";
  }
}
