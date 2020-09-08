import assert from "assert";
import RNumber from "../../src/structures/RNumber.js";
import Format from "../../src/Format.js";

describe("Formatting", () => {
  describe("Percent format", () => {
    it("percent format", () => {
      const num = 1.123123;
      const result = RNumber.formatPercent(num);
      assert.equal(result, "1.12%");
    });
    it("dollar format", () => {
      const num = 1.123123;
      const result = RNumber.formatDollar(num);
      assert.equal(result, "$1.12");
    });
    it("multiplier format", () => {
      const num = 1.123123;
      const result = RNumber.formatMultiplier(num);
      assert.equal(result, "1.12x");
    });
  });
});

describe("Parsing", () => {
  describe("Time parsing", () => {
    it("parses time correctly", () => {
      const duration = Format.parseTime("16d 21h 43m 4s 455ms 803x");
      assert.equal(duration, 1460584455);
    });
  });
});
