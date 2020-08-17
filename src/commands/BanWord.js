import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";

class BanWord extends Command {
  execute() {
    // TODO: Check if censorship is enabled at all

    const words = this.message.args;
    if (words.length === 0) {
      return this.inputChannel.watchSend(
        "Try again and specify what words will be banned. E.g. `BanWord cat dog apple`"
      );
    }

    const censorshipController = new CensorController(this.db, this.guild);
    censorshipController
      .insertWords(words)
      .then(censorshipController.rebuildCensorshipList());

    return this.inputChannel.watchSend(
      `You won't see these words again: ${words}`
    );
  }
}

export default BanWord;
