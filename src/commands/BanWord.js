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
  }

  execute() {
    // TODO: Check if censorship is enabled at all

    const words = this.message.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    return this.censorController
      .insertWords(words)
      .then(() => this.censorController.rebuildCensorshipList())
      .then(this.inputChannel.watchSend(`You won't see these words again: ${words}`))
      .then(() => this.useItem());
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `BanWord cat dog apple`");
  }
}

export default BanWord;
