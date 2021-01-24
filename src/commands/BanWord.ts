import BanListStatusController from "../controllers/message/BanListStatusController.js";
import CensorController from "../controllers/CensorController.js";
import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import Util from "../Util.js";

export default class BanWord extends Command {
  constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**BanWord**\nAdd a word to the ban list";
    this.usage = "Usage: `BanWord word1 word2 etc1`";
  }

  async execute(): Promise<any> {
    // TODO: Check if censorship is enabled at all

    const words = this.ec.messageHelper.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    return this.ec.censorController
      .insertWords(words)
      .then(() => this.useItem())
      .then(() => this.ec.banListStatusController.update())
      .then(() => this.ec.channelHelper.watchSend("Banned words list has been updated"));
  }
}
