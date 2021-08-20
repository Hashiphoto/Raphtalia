import RNumber from "../../src/structures/RNumber";
import Util from "../../src/Util";
import assert from "assert";

describe("Utilting", () => {
  describe("Percent format", () => {
    it("percent format", () => {
      const num = 1.123123;
      const result = RNumber.formatPercent(num);
      assert.equal(result, "1.12%");
    });
    it("dollar format", () => {
      const num = 1.123123;
      const result = format(num);
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
      const duration = Util.parseTime("16d 21h 43m 4s 455ms 803x");
      assert.equal(duration, 1460584455);
    });
  });
});
