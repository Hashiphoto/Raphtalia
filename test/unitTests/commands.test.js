import assert from "assert";
import TestMessage from "../structures/Message.test.js";
import Help from "../../src/commands/Help.js";
import AllowWord from "../../src/commands/AllowWord.js";
import sinon from "sinon";
import TestCensorController from "../structures/CensorController.test.js";
import AutoDelete from "../../src/commands/AutoDelete.js";
import TestChannelController from "../structures/ChannelController.test.js";

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
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe("AllowWord", () => {
    it("fails if no arguments are given", () => {
      const allowWord = new AllowWord(new TestMessage());
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

  describe("AutoDelete", () => {
    it("fails if no arguments are given", () => {
      const autoDelete = new AutoDelete(new TestMessage());
      sandbox.spy(autoDelete, "sendHelpMessage");

      autoDelete.execute();

      assert(autoDelete.sendHelpMessage.calledOnce);
    });

    it("fails if start or stop is not specified", () => {
      const autoDelete = new AutoDelete(new TestMessage("foo"));
      sandbox.spy(autoDelete, "sendHelpMessage");

      autoDelete.execute();

      assert(autoDelete.sendHelpMessage.calledOnce);
    });

    it("does not allow start AND stop to be specified", () => {
      const autoDelete = new AutoDelete(new TestMessage("start stop 100"));
      sandbox.spy(autoDelete, "sendHelpMessage");

      autoDelete.execute();

      assert(autoDelete.sendHelpMessage.calledOnce);
    });

    it("parses start message", () => {
      const channelController = new TestChannelController();
      const autoDelete = new AutoDelete(new TestMessage("start 1234ms"), channelController);

      autoDelete.execute();

      assert.equal(channelController.channel.enable, true);
      assert.equal(channelController.channel.deleteDelay, 1234);
    });

    it("parses stop message", () => {
      const channelController = new TestChannelController();
      const autoDelete = new AutoDelete(new TestMessage("stop"), channelController);

      autoDelete.execute();

      assert.equal(channelController.channel.enable, false);
    });
  });

  // Simple enough to justify lack of testing. Left here in case it becomes more
  // complex in the future and needs unit testing
  describe("Balance", () => {});

  describe("BanList", () => {});

  describe("Help", () => {
    it("sends the help message", async () => {
      const message = new TestMessage();
      const help = new Help(message);

      help.execute().then((message) => {
        assert.equal(message, "Help yourself, TEST");
      });
    });
  });
});
