import TestChannel from "./TestChannel";
import TestGuild from "./TestGuild";
import TestMember from "./TestMember";

class TestMessage {
  constructor(content = "") {
    this.channel = new TestChannel();
    this.guild = new TestGuild();
    this.sender = new TestMember();
    this.content = content;
    this.args = content.length ? content.split(" ") : [];
    this.mentionedMembers = [];
  }

  setMentionedMembers(memberList) {
    this.mentionedMembers = memberList;
    return this;
  }
}

export default TestMessage;
