import assert from "assert";
import TestMessage from "../structures/TestMessage.js";
import Help from "../../src/commands/Help.js";
import AllowWord from "../../src/commands/AllowWord.js";
import sinon from "sinon";
import TestCensorController from "../structures/TestCensorController.js";
import AutoDelete from "../../src/commands/AutoDelete.js";
import TestChannelController from "../structures/TestChannelController.js";
import TestCurrencyController from "../structures/TestCurrencyController.js";
import Balance from "../../src/commands/Balance.js";
import TestChannel from "../structures/TestChannel.js";
import RNumber from "../../src/structures/RNumber.js";
import BanList from "../../src/commands/BanList.js";
import Format from "../../src/Format.js";
import BanWord from "../../src/commands/BanWord.js";
import CensorController from "../../src/controllers/CensorController.js";
import Censorship from "../../src/commands/Censorship.js";
import TestGuildController from "../structures/TestGuildController.js";
import Comfort from "../../src/commands/Comfort.js";

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

      return allowWord.execute().then((text) => assert(allowWord.sendHelpMessage.calledOnce));
    });

    it("deletes the words given", () => {
      const message = new TestMessage("apple banana 34%^");
      const censorController = new TestCensorController();
      const allowWord = new AllowWord(message, censorController);
      sandbox.spy(censorController, "rebuildCensorshipList");

      return allowWord.execute().then((text) => {
        assert(censorController.deletedWords.equals(["apple", "banana", "34%^"]));
        assert(censorController.rebuildCensorshipList.calledOnce);
      });
    });
  });

  describe("AutoDelete", () => {
    it("fails if no arguments are given", () => {
      const autoDelete = new AutoDelete(new TestMessage());
      sandbox.spy(autoDelete, "sendHelpMessage");

      return autoDelete.execute().then(() => {
        assert(autoDelete.sendHelpMessage.calledOnce);
      });
    });

    it("fails if start or stop is not specified", () => {
      const autoDelete = new AutoDelete(new TestMessage("foo"));
      sandbox.spy(autoDelete, "sendHelpMessage");

      return autoDelete.execute().then(() => {
        assert(autoDelete.sendHelpMessage.calledOnce);
      });
    });

    it("does not allow start AND stop to be specified", () => {
      const autoDelete = new AutoDelete(new TestMessage("start stop 100"));
      sandbox.spy(autoDelete, "sendHelpMessage");

      return autoDelete.execute().then(() => {
        assert(autoDelete.sendHelpMessage.calledOnce);
      });
    });

    it("parses start message", () => {
      const channelController = new TestChannelController();
      const autoDelete = new AutoDelete(new TestMessage("start 1234ms"), channelController);

      return autoDelete.execute().then(() => {
        assert.equal(channelController.channel.enable, true);
        assert.equal(channelController.channel.deleteDelay, 1234);
      });
    });

    it("parses stop message", () => {
      const channelController = new TestChannelController();
      const autoDelete = new AutoDelete(new TestMessage("stop"), channelController);

      return autoDelete.execute().then(() => {
        assert.equal(channelController.channel.enable, false);
      });
    });
  });

  describe("Balance", () => {
    it("makes the correct calls to CurrencyController", () => {
      const currencyController = new TestCurrencyController();
      currencyController.getCurrency = () => {
        return Promise.resolve(54);
      };
      const message = new TestMessage();
      const balance = new Balance(message, currencyController);

      return balance
        .execute()
        .then((text) => assert.equal(text, `You have ${RNumber.formatDollar(54)} in TEST_GUILD`));
    });
  });

  describe("BanList", () => {
    it("makes the correct calls to the CensorController", () => {
      const censorController = new TestCensorController();
      const fakeBanList = ["foo", "bar", "lemon"];
      censorController.setBanList(fakeBanList);
      const banList = new BanList(new TestMessage(), censorController);

      return banList
        .execute()
        .then((text) =>
          assert(text === `Here are all the banned words: ${Format.listFormat(fakeBanList)}`)
        );
    });
  });

  describe("BanWord", () => {
    it("fails if no args are given", () => {
      const banWord = new BanWord(new TestMessage());
      sandbox.spy(banWord, "sendHelpMessage");

      return banWord.execute().then((text) => {
        assert(banWord.sendHelpMessage.calledOnce);
      });
    });

    it("makes the correct calls to the CensorController", () => {
      const censorController = new TestCensorController();
      const banWord = new BanWord(new TestMessage("cat dog apple"), censorController);
      sandbox.spy(censorController, "rebuildCensorshipList");

      return banWord.execute().then((text) => {
        assert(censorController.rebuildCensorshipList.calledOnce);
        assert(censorController.insertedWords.equals(["cat", "dog", "apple"]));
      });
    });
  });

  describe("Censorship", () => {
    it("fails if start or stop is not specified", () => {
      const censorship = new Censorship(new TestMessage("text foo bar lasagna"));
      sandbox.spy(censorship, "sendHelpMessage");

      return censorship.execute().then(() => {
        assert(censorship.sendHelpMessage.calledOnce);
      });
    });

    it("fails if both start and stop are specified", () => {
      const censorship = new Censorship(new TestMessage("start stop"));
      sandbox.spy(censorship, "sendHelpMessage");

      return censorship.execute().then(() => {
        assert(censorship.sendHelpMessage.calledOnce);
      });
    });

    it("starts censoring", () => {
      const guildController = new TestGuildController();
      const censorship = new Censorship(new TestMessage("foo start bar"), guildController);

      return censorship.execute().then(() => {
        assert(guildController.isCensoring === true);
      });
    });

    it("stops censoring", () => {
      const guildController = new TestGuildController();
      const censorship = new Censorship(new TestMessage("foo stop bar"), guildController);

      return censorship.execute().then(() => {
        assert(guildController.isCensoring === false);
      });
    });
  });

  describe("Comfort", () => {
    it("fails if no one is mentioned", () => {
      const comfort = new Comfort(new TestMessage("foo bar"));
      sandbox.spy(comfort, "sendHelpMessage");

      return comfort.execute().then(() => {
        assert(comfort.sendHelpMessage.calledOnce);
      });
    });

    it("comforts everyone mentioned", () => {
      const message = new TestMessage("foo bar").setMentionedMembers(["TEST1", "TEST2", "TEST3"]);
      const comfort = new Comfort(message);

      return comfort.execute().then((text) => {
        assert(text.includes("TEST1"));
        assert(text.includes("TEST2"));
        assert(text.includes("TEST3"));
      });
    });
  });

  describe("Help", () => {
    it("sends the help message", async () => {
      const message = new TestMessage();
      const help = new Help(message);

      return help.execute().then((text) => assert.equal(text, "Help yourself, TEST_MEMBER"));
    });
  });
});
