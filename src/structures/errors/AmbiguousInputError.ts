import Util from "../../Util";

export default class AmbiguousInputError extends Error {
  private possibleResults: string[];

  public constructor(possibleResults: string[], ...params: any) {
    super(...params);

    this.name = "AmbiguousInputError";
    this.possibleResults = possibleResults;
    this.message = Util.listFormat(possibleResults, "or");
  }
}
