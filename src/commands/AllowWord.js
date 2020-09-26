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
  }

  execute() {
    // TODO: Check if censorship is enabled at all

    let words = this.message.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    return this.censorController
      .deleteWords(words)
      .then(this.censorController.rebuildCensorshipList())
      .then(this.inputChannel.watchSend(`These words are allowed again: ${words}`))
      .then(() => this.useItem());
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `AllowWord word1 word2 etc`");
  }
}

export default AllowWord;
