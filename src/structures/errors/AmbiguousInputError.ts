import Util from "../../Util.js";

class AmbiguousInputError extends Error {
  constructor(possibleResults, ...params) {
    super(...params);

    this.name = "AmbiguousInputError";
    this.possibleResults = possibleResults;
    this.message = Util.listFormat(possibleResults, "or");
  }
}

export default AmbiguousInputError;
