import Discord from "discord.js";

import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";

class AllowWord extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CensorController} censorController
   */
  constructor(message, censorController) {
    super(message);
    this.censorController = censorController;
    this.instructions = "**AllowWord**\nRemove a word from the ban list";
    this.usage = "Usage: `AllowWord word1 word2 etc`";
  }

  execute() {
    // TODO: Check if censorship is enabled at all

    let words = this.message.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (words.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    return this.censorController
      .deleteWords(words)
      .then(this.censorController.rebuildCensorshipList())
      .then(this.inputChannel.watchSend(`These words are allowed again: ${words}`))
      .then(() => this.useItem(words.length));
  }
}

export default AllowWord;
