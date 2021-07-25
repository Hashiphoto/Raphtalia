import { Result } from "../../enums/Result";

export default class MemberLimitError extends Error {
  public result: Result;

  public constructor(result: Result, ...params: any) {
    super(...params);

    this.result = result;
  }
}
