import TestChannel from "./Channel.test.js";
import TestGuild from "./Guild.test.js";
import TestMember from "./Member.test.js";

class TestMessage {
  constructor(content = "") {
    this.channel = new TestChannel();
    this.guild = new TestGuild();
    this.sender = new TestMember();
    this.content = content;
    this.args = content.length ? content.split(" ") : [];
  }
}

export default TestMessage;
