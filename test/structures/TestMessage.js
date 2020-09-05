import TestChannel from "./TestChannel.js";

class TestMessage {
  constructor(content = "") {
    this.channel = new TestChannel();
    this.sender = "TEST";
    this.content = content;
    this.args = content.length ? content.split(" ") : [];
  }
}

export default TestMessage;
