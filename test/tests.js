import assert from "assert";
import commands from "../src/commands.js";
import Channel from "./structures/Channel.js";
import Message from "./structures/Message.js";

describe("Default", () => {
  it("Should always pass", () => {
    assert.equal(1, 1);
  });
});

describe("Help", () => {
  it("Sends the help message", async () => {
    const message = new Message();
    message.sender = "test";
    let response = commands.help(message);
    assert.equal(response, "Help yourself, test");
  });
});
