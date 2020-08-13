import assert from "assert";
import commands from "../src/commands.js";
import Channel from "./structures/Channel.js";
import Message from "./structures/Message.js";
import { calculatePayout } from "../src/util/currencyManagement.js";
import { percentFormat } from "../src/util/format.js";

describe("Calculations", () => {
  describe("Help", () => {
    it("sends the help message", async () => {
      const message = new Message();
      message.sender = "test";
      let response = commands.help(message);
      assert.equal(response, "Help yourself, test");
    });
  });

  describe("Message payout", () => {
    it("gives money for each character", () => {
      let message = { content: { length: 10 } };
      let dbGuild = {
        base_payout: 0,
        character_value: 1,
        max_payout: 999,
        min_length: 0,
      };
      var result = calculatePayout(message, dbGuild);
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
      var result = calculatePayout(message, dbGuild);
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
      var result = calculatePayout(message, dbGuild);
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
      var result = calculatePayout(message, dbGuild);
      assert.equal(result, 0);
    });
  });

  describe("Percent format", () => {
    it("truncates long decimals", () => {
      const num = 123.123123;
      const result = percentFormat(num);
      assert.equal(result, "12312.31");
    });
    it("rounds up", () => {
      const num = 123.12349;
      const result = percentFormat(num);
      assert.equal(result, "12312.35");
    });
    it("returns 0 for non-numbers", () => {
      const notNumber = null;
      const result = percentFormat(notNumber);
      assert.equal(result, "0.00");
    });
  });
});
