import assert from "assert";
import RNumber from "../../src/structures/RNumber.js";

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
    it("formatMultipliers", () => {
      const num = 1.123123;
      const result = RNumber.formatMultiplier(num);
      assert.equal(result, "1.12x");
    });
  });
});
