import TestChannel from "./Channel.test.js";

class TestMember {
  constructor() {}

  createDM() {
    return Promise.resolve(new TestChannel());
  }
}

TestMember.prototype.toString = () => {
  return "TEST_MEMBER";
};

export default TestMember;
