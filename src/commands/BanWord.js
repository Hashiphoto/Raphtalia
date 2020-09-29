import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";

class BanWord extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CensorController} censorController
   */
  constructor(message, censorController) {
    super(message);
    this.censorController = censorController;
    this.instructions = "**BanWord**\nAdd a word to the ban list";
    this.usage = "Usage: `BanWord word1 word2 etc1`";
  }

  execute() {
    // TODO: Check if censorship is enabled at all

    const words = this.message.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    return this.censorController
      .insertWords(words)
      .then(() => this.censorController.rebuildCensorshipList())
      .then(this.inputChannel.watchSend(`You won't see these words again: ${words}`))
      .then(() => this.useItem(words.length));
  }
}

export default BanWord;
