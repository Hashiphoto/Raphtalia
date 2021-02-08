export default class EarlyExitError extends Error {
  constructor(...params: any) {
    super(...params);

    this.name = "EarlyExitError";
  }
}
