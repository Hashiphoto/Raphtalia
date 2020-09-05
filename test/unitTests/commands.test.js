import assert from "assert";
import TestMessage from "../structures/TestMessage.js";
import Help from "../../src/commands/Help.js";
import AllowWord from "../../src/commands/AllowWord.js";
import sinon from "sinon";
import TestCensorController from "../structures/TestCensorController.js";

/**
 * Allows arrays to be compared to other arrays for equality
 *
 * @param {Object[]} array
 */
Array.prototype.equals = function (array) {
  if (!array) return false;

  if (this.length != array.length) return false;

  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] instanceof Array && array[i] instanceof Array) {
      if (!this[i].equals(array[i])) return false;
    } else if (this[i] != array[i]) {
      return false;
    }
  }
  return true;
};

describe("Commands", () => {
  describe("AllowWord", () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
      sandbox.restore();
    });

    it("doesn't work if no words are given", () => {
      const message = new TestMessage();
      const allowWord = new AllowWord(message);
      sandbox.spy(allowWord, "sendHelpMessage");

      allowWord.execute();

      assert(allowWord.sendHelpMessage.calledOnce);
    });

    it("deletes the words given and rebuilds the censor list", () => {
      const message = new TestMessage("apple banana 34%^");
      const censorController = new TestCensorController();
      const allowWord = new AllowWord(message, censorController);
      sandbox.spy(censorController, "rebuildCensorshipList");

      allowWord.execute();

      assert(censorController.deletedWords.equals(["apple", "banana", "34%^"]));
      assert(censorController.rebuildCensorshipList.calledOnce);
    });
  });

  describe("Help", () => {
    it("sends the help message", async () => {
      const message = new TestMessage();
      const help = new Help(message);

      help.execute();

      assert.equal(help.inputChannel.output, "Help yourself, TEST");
    });
  });
});
