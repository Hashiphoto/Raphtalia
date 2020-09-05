import assert from "assert";
import CurrencyController from "../../src/controllers/CurrencyController.js";

describe("Calculations", () => {
  describe("Message payout", () => {
    it("gives money for each character", () => {
      let message = { content: { length: 10 } };
      let dbGuild = {
        base_payout: 0,
        character_value: 1,
        max_payout: 999,
        min_length: 0,
      };
      const currencyController = new CurrencyController(null, null);
      var result = currencyController.calculatePayout(message, dbGuild);
      assert.equal(result, 10);
    });
    it("limits money by max_payout", () => {
      let message = { content: { length: 10 } };
      let dbGuild = {
        base_payout: 0,
        character_value: 1000,
        max_payout: 10,
        min_length: 0,
      };
      const currencyController = new CurrencyController(null, null);
      var result = currencyController.calculatePayout(message, dbGuild);
      assert.equal(result, 10);
    });
    it("adds base_payout to total", () => {
      let message = { content: { length: 10 } };
      let dbGuild = {
        base_payout: 5,
        character_value: 1,
        max_payout: 999,
        min_length: 0,
      };
      const currencyController = new CurrencyController(null, null);
      var result = currencyController.calculatePayout(message, dbGuild);
      assert.equal(result, 15);
    });
    it("does not pay for messages below the minimum length", () => {
      let message = { content: { length: 10 } };
      let dbGuild = {
        base_payout: 0,
        character_value: 1,
        max_payout: 999,
        min_length: 11,
      };
      const currencyController = new CurrencyController(null, null);
      var result = currencyController.calculatePayout(message, dbGuild);
      assert.equal(result, 0);
    });
  });
});
