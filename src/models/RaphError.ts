import { Result } from "../enums/Result";

export default class RaphError extends Error {
  public result: Result;
  private _message: string | undefined;
  public name: "RaphError";

  public constructor(result: Result, message?: string) {
    super(message);

    this.result = result;
    this._message = message;
  }

  public get message(): string {
    return this._message ?? "";
  }
}
