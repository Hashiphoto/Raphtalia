import assert from "assert";
import Message from "../structures/Message.js";
import Help from "../../src/commands/Help.js";

describe("Commands", () => {
  describe("Help", () => {
    it("sends the help message", async () => {
      const message = new Message();
      message.sender = "test";
      let response = commands.help(message);
      assert.equal(response, "Help yourself, test");
    });
  });
});
