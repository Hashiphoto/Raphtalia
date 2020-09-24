import Format from "../Format.js";

class AmbiguousInputError extends Error {
  constructor(possibleResults, ...params) {
    super(...params);

    this.name = "AmbiguousInputError";
    this.possibleResults = possibleResults;
    this.message = Format.listFormat(possibleResults, "or");
  }
}

export default AmbiguousInputError;
