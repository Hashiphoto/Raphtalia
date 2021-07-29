import { Result } from "../../enums/Result";

export default class RaphError extends Error {
  public result: Result;

  public constructor(result: Result, ...params: any) {
    super(...params);

    this.result = result;
  }
}
