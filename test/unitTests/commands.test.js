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
import DeliverCheck from "../../src/commands/DeliverCheck.js";
import Demote from "../../src/commands/Demote.js";
import TestMemberController from "../structures/TestMemberController.js";
import Economy from "../../src/commands/Economy.js";
import GuildController from "../../src/controllers/GuildController.js";
import TestGuild from "../structures/TestGuild.js";
import Exile from "../../src/commands/Exile.js";
import Fine from "../../src/commands/Fine.js";
import Give from "../../src/commands/Give.js";
import UserItem from "../../src/structures/UserItem.js";
import TestInventoryController from "../structures/TestInventoryController.js";

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
      const allowWord = new AllowWord(new TestMessage())
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(allowWord, "sendHelpMessage");

      return allowWord.execute().then((text) => assert(allowWord.sendHelpMessage.calledOnce));
    });

    it("deletes the words given", () => {
      const message = new TestMessage("apple banana 34%^");
      const censorController = new TestCensorController();
      const allowWord = new AllowWord(message, censorController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(censorController, "rebuildCensorshipList");

      return allowWord.execute().then((text) => {
        assert(censorController.deletedWords.equals(["apple", "banana", "34%^"]));
        assert(censorController.rebuildCensorshipList.calledOnce);
      });
    });
  });

  describe("AutoDelete", () => {
    it("fails if no arguments are given", () => {
      const autoDelete = new AutoDelete(new TestMessage())
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(autoDelete, "sendHelpMessage");

      return autoDelete.execute().then(() => {
        assert(autoDelete.sendHelpMessage.calledOnce);
      });
    });

    it("fails if start or stop is not specified", () => {
      const autoDelete = new AutoDelete(new TestMessage("foo"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(autoDelete, "sendHelpMessage");

      return autoDelete.execute().then(() => {
        assert(autoDelete.sendHelpMessage.calledOnce);
      });
    });

    it("does not allow start AND stop to be specified", () => {
      const autoDelete = new AutoDelete(new TestMessage("start stop 100"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(autoDelete, "sendHelpMessage");

      return autoDelete.execute().then(() => {
        assert(autoDelete.sendHelpMessage.calledOnce);
      });
    });

    it("parses start message", () => {
      const channelController = new TestChannelController();
      const autoDelete = new AutoDelete(new TestMessage("start 1234ms"), channelController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      return autoDelete.execute().then(() => {
        assert(channelController.channel.enable === true);
        assert(channelController.channel.deleteDelay === 1234);
      });
    });

    it("parses stop message", () => {
      const channelController = new TestChannelController();
      const autoDelete = new AutoDelete(new TestMessage("stop"), channelController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      return autoDelete.execute().then(() => {
        assert(channelController.channel.enable === false);
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
      const balance = new Balance(message, currencyController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      sandbox.spy(currencyController, "getCurrency");

      return balance.execute().then(() => assert(currencyController.getCurrency.calledOnce));
    });
  });

  describe("BanList", () => {
    it("makes the correct calls to the CensorController", () => {
      const censorController = new TestCensorController();
      const fakeBanList = ["foo", "bar", "lemon"];
      censorController.setBanList(fakeBanList);
      const banList = new BanList(new TestMessage(), censorController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(censorController, "getAllBannedWords");

      return banList.execute().then((text) => {
        assert(censorController.getAllBannedWords.calledOnce);
        assert(
          banList.inputChannel.output ===
            `Here are all the banned words: ${Format.listFormat(fakeBanList)}`
        );
      });
    });
  });

  describe("BanWord", () => {
    it("fails if no args are given", () => {
      const banWord = new BanWord(new TestMessage())
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(banWord, "sendHelpMessage");

      return banWord.execute().then((text) => {
        assert(banWord.sendHelpMessage.calledOnce);
      });
    });

    it("makes the correct calls to the CensorController", () => {
      const censorController = new TestCensorController();
      const banWord = new BanWord(new TestMessage("cat dog apple"), censorController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(censorController, "rebuildCensorshipList");

      return banWord.execute().then((text) => {
        assert(censorController.rebuildCensorshipList.calledOnce);
        assert(censorController.insertedWords.equals(["cat", "dog", "apple"]));
      });
    });
  });

  describe("Censorship", () => {
    it("fails if start or stop is not specified", () => {
      const censorship = new Censorship(new TestMessage("text foo bar lasagna"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(censorship, "sendHelpMessage");

      return censorship.execute().then(() => {
        assert(censorship.sendHelpMessage.calledOnce);
      });
    });

    it("fails if both start and stop are specified", () => {
      const censorship = new Censorship(new TestMessage("start stop"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(censorship, "sendHelpMessage");

      return censorship.execute().then(() => {
        assert(censorship.sendHelpMessage.calledOnce);
      });
    });

    it("starts censoring", () => {
      const guildController = new TestGuildController();
      const censorship = new Censorship(new TestMessage("foo start bar"), guildController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      return censorship.execute().then(() => {
        assert(guildController.isCensoring === true);
      });
    });

    it("stops censoring", () => {
      const guildController = new TestGuildController();
      const censorship = new Censorship(new TestMessage("foo stop bar"), guildController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      return censorship.execute().then(() => {
        assert(guildController.isCensoring === false);
      });
    });
  });

  describe("Comfort", () => {
    it("fails if no one is mentioned", () => {
      const comfort = new Comfort(new TestMessage("foo bar"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(comfort, "sendHelpMessage");

      return comfort.execute().then(() => {
        assert(comfort.sendHelpMessage.calledOnce);
      });
    });

    it("comforts everyone mentioned", () => {
      const message = new TestMessage("foo bar").setMentionedMembers(["TEST1", "TEST2", "TEST3"]);
      const comfort = new Comfort(message)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      return comfort.execute().then(() => {
        const text = comfort.inputChannel.output;
        assert(text.includes("TEST1"));
        assert(text.includes("TEST2"));
        assert(text.includes("TEST3"));
      });
    });
  });

  describe("DeliverCheck", () => {
    it("fails if no members are mentioned", () => {
      const deliverCheck = new DeliverCheck(new TestMessage("plenty of args foo bar"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(deliverCheck, "sendHelpMessage");

      return deliverCheck.execute().then(() => {
        assert(deliverCheck.sendHelpMessage.calledOnce);
      });
    });

    it("fails if no number is given", () => {
      const message = new TestMessage("foo bar").setMentionedMembers(["TEST1", "TEST2"]);
      const deliverCheck = new DeliverCheck(message)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(deliverCheck, "sendHelpMessage");

      return deliverCheck.execute().then(() => {
        assert(deliverCheck.sendHelpMessage.calledOnce);
      });
    });

    it("adds currency to the mentioned members", () => {
      const message = new TestMessage("$450").setMentionedMembers(["TEST1", "TEST2"]);
      const currencyController = new TestCurrencyController();
      const deliverCheck = new DeliverCheck(message, currencyController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());

      return deliverCheck
        .execute()
        .then(() => {
          assert(deliverCheck.inputChannel.output);
          assert(deliverCheck.inputChannel.output.length > 0);
          return currencyController.getCurrency("TEST1");
        })
        .then((currency1) => {
          assert(currency1 === 450);
          return currencyController.getCurrency("TEST2");
        })
        .then((currency2) => {
          assert(currency2 === 450);
        });
    });
  });

  describe("Demote", () => {
    it("fails if no one is mentioned", () => {
      const demote = new Demote(new TestMessage("text that isn't mentions"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(demote, "sendHelpMessage");

      return demote.execute().then(() => {
        assert(demote.sendHelpMessage.calledOnce);
      });
    });

    it("infracts users attempting to demote superior members", () => {
      const memberController = new TestMemberController();
      const demote = new Demote(new TestMessage(), memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      demote.message.setMentionedMembers(["TEST1", "TEST2"]);
      demote.sender.hasAuthorityOver = () => false;
      sandbox.spy(memberController, "addInfractions");

      return demote.execute().then(() => {
        assert(memberController.addInfractions.calledOnce);
      });
    });

    it("calls demote on all mentioned members", () => {
      const memberController = new TestMemberController();
      const demote = new Demote(new TestMessage(), memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      demote.message.setMentionedMembers(["TEST1", "TEST2"]);
      demote.sender.hasAuthorityOver = () => true;
      sandbox.spy(memberController, "demoteMember");

      return demote.execute().then(() => {
        assert(memberController.demoteMember.calledTwice);
      });
    });
  });

  describe("Economy", () => {
    it("fails if fewer than 2 arguments are given", () => {
      const economy = new Economy(new TestMessage("foo"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(economy, "sendHelpMessage");

      economy.execute().then(() => {
        assert(economy.sendHelpMessage.calledOnce);
      });
    });

    it("fails if an argument is not recognized", () => {
      const guildController = new TestGuildController();
      const economy = new Economy(
        new TestMessage(
          "MinLength 100 charValue $10 maxpayout $100 basepayout $13 tAxRaTe 45% foo"
        ),
        guildController
      )
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(economy, "sendHelpMessage");

      return economy.execute().then(() => {
        assert(economy.sendHelpMessage.calledOnce);
      });
    });

    it("fails if a value is not supplied for an argument", () => {
      const guildController = new TestGuildController();
      const economy = new Economy(
        new TestMessage("MinLength 100 charValue $10 maxpayout basepayout $13 tAxRaTe 45%"),
        guildController
      )
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(economy, "sendHelpMessage");

      return economy.execute().then(() => {
        assert(economy.sendHelpMessage.calledOnce);
      });
    });

    it("correctly parses all parameters", () => {
      const guildController = new TestGuildController();
      const economy = new Economy(
        new TestMessage("MinLength 100 charValue $10 maxpayout $100 basepayout $13 tAxRaTe 45%"),
        guildController
      )
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(guildController);

      return economy.execute().then(() => {
        assert(guildController.setMinLength.calledOnce);
        assert(guildController.setCharacterValue.calledOnce);
        assert(guildController.setMaxPayout.calledOnce);
        assert(guildController.setBasePayout.calledOnce);
        assert(guildController.setTaxRate.calledOnce);
      });
    });
  });

  describe("Exile", () => {
    it("fails if no one is mentioned", () => {
      const exile = new Exile(new TestMessage())
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(exile, "sendHelpMessage");

      return exile.execute().then(() => {
        assert(exile.sendHelpMessage.calledOnce);
      });
    });

    it("infracts users attempting to exile superior members", () => {
      const memberController = new TestMemberController();
      const exile = new Exile(new TestMessage(), memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      exile.message.setMentionedMembers(["TEST1", "TEST2"]);
      exile.sender.hasAuthorityOver = () => false;
      sandbox.spy(memberController, "addInfractions");

      return exile.execute().then(() => {
        assert(memberController.addInfractions.calledOnce);
      });
    });

    it("exiles the target members without a timer", () => {
      const memberController = new TestMemberController();
      const exile = new Exile(new TestMessage(), memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      exile.message.setMentionedMembers(["TEST1", "TEST2"]);
      exile.sender.hasAuthorityOver = () => true;
      sandbox.spy(exile.inputChannel, "watchSend");
      sandbox.spy(memberController, "exileMember");

      return exile.execute().then(() => {
        assert(memberController.exileMember.calledTwice);
        assert(exile.inputChannel.watchSend.calledOnce);
      });
    });

    it("exiles the target members with a timer", () => {
      const memberController = new TestMemberController();
      const exile = new Exile(new TestMessage("0s"), memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      exile.message.setMentionedMembers(["TEST1", "TEST2"]);
      exile.sender.hasAuthorityOver = () => true;
      sandbox.spy(exile.inputChannel, "watchSend");
      sandbox.spy(memberController, "exileMember");

      return exile.execute().then(() => {
        assert(memberController.exileMember.calledTwice);
        assert(memberController.exileDuration === 0);
        assert(exile.inputChannel.watchSend.calledThrice);
      });
    });
  });

  describe("Fine", () => {
    it("fails if no members are mentioned", () => {
      const fine = new Fine(new TestMessage())
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(fine, "sendHelpMessage");

      return fine.execute().then(() => {
        assert(fine.sendHelpMessage.calledOnce);
      });
    });

    it("infracts users attempting to fine superior members", () => {
      const memberController = new TestMemberController();
      const fine = new Fine(new TestMessage(), null, memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      fine.message.setMentionedMembers(["TEST1", "TEST2"]);
      fine.sender.hasAuthorityOver = () => false;
      sandbox.spy(memberController, "addInfractions");

      return fine.execute().then(() => {
        assert(memberController.addInfractions.calledOnce);
      });
    });

    it("fails if no number is given", () => {
      const fine = new Fine(new TestMessage("words that aren't numbers"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      fine.message.setMentionedMembers(["TEST1", "TEST2"]);
      fine.sender.hasAuthorityOver = () => true;
      sandbox.spy(fine, "sendHelpMessage");

      fine.execute().then(() => {
        assert(fine.sendHelpMessage.calledOnce);
      });
    });

    it("correctly fines all mentioned members", () => {
      const memberController = new TestMemberController();
      const currencyController = new TestCurrencyController();
      const fine = new Fine(new TestMessage("$41.01"), currencyController, memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      fine.message.setMentionedMembers(["TEST1", "TEST2"]);
      fine.sender.hasAuthorityOver = () => true;
      sandbox.spy(currencyController, "transferCurrency");
      sandbox.spy(fine.inputChannel, "watchSend");

      fine.execute().then(() => {
        assert(currencyController.transferCurrency.calledTwice);
        assert(fine.inputChannel.watchSend.calledOnce);
      });
    });
  });

  describe("Give", () => {
    it("fails if there are no args", () => {
      const give = new Give(new TestMessage(""))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(give, "sendHelpMessage");

      return give.execute().then(() => {
        assert(give.sendHelpMessage.calledOnce);
      });
    });

    it("fails if there are no mentioned members", () => {
      const give = new Give(new TestMessage("foo bar"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      sandbox.spy(give, "sendHelpMessage");

      return give.execute().then(() => {
        assert(give.sendHelpMessage.calledOnce);
      });
    });

    it("fails if a money amount is not specified", () => {
      const give = new Give(new TestMessage("foo bar"))
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      give.message.setMentionedMembers(["TEST1", "TEST2"]);
      sandbox.spy(give, "sendHelpMessage");

      return give.execute().then(() => {
        assert(give.sendHelpMessage.calledOnce);
      });
    });

    it("infracts user sending negative money", () => {
      const memberController = new TestMemberController();
      const give = new Give(new TestMessage("-$50.00"), null, memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      give.message.setMentionedMembers(["TEST1", "TEST2"]);
      sandbox.spy(give, "sendHelpMessage");
      sandbox.spy(memberController, "addInfractions");

      return give.execute().then(() => {
        assert(memberController.addInfractions.calledOnce);
        assert(give.sendHelpMessage.notCalled);
      });
    });

    it("fails if the sender does not have enough money", () => {
      const memberController = new TestMemberController();
      const currencyController = new TestCurrencyController();
      currencyController.getCurrency = () => Promise.resolve(49.99);
      const give = new Give(new TestMessage("$25.00"), currencyController, memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      give.message.setMentionedMembers(["TEST1", "TEST2"]);
      sandbox.spy(give, "sendHelpMessage");
      sandbox.spy(currencyController, "transferCurrency");

      return give.execute().then(() => {
        assert(give.sendHelpMessage.notCalled);
        assert(currencyController.transferCurrency.notCalled);
      });
    });

    it("transfers currency to each member", () => {
      const memberController = new TestMemberController();
      const currencyController = new TestCurrencyController();
      currencyController.getCurrency = () => Promise.resolve(50.0);
      const give = new Give(new TestMessage("$25.00"), currencyController, memberController)
        .setItem(new UserItem())
        .setInventoryController(new TestInventoryController());
      give.message.setMentionedMembers(["TEST1", "TEST2"]);
      sandbox.spy(give, "sendHelpMessage");
      sandbox.spy(currencyController, "transferCurrency");

      return give.execute().then(() => {
        assert(give.sendHelpMessage.notCalled);
        assert(currencyController.transferCurrency.calledTwice);
      });
    });
  });
});
