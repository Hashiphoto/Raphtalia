import Discord from "discord.js";

import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";

class AllowWord extends Command {
  execute() {
    // TODO: Check if censorship is enabled at all

    let words = this.message.args;
    if (words.length === 0) {
      return this.inputChannel.watchSend(
        "Try again and specify what words will be allowed. E.g. `AllowWord cat dog apple`"
      );
    }

    const censorController = new CensorController(this.db, this.guild);
    censorController
      .deleteWords(words)
      .then(censorController.rebuildCensorshipList());

    return this.inputChannel.watchSend(
      `These words are allowed again: ${words}`
    );
  }
}

export default AllowWord;
