import db from "./db/db.js";
import Command from "./Command.js";
import CensorManager from "../CensorManager.js";

class BanWord extends Command {
  execute() {
    // TODO: Check if censorship is enabled at all

    const words = this.message.args;
    if (words.length === 0) {
      return this.inputChannel.watchSend(
        "Try again and specify what words will be banned. E.g. `BanWord cat dog apple`"
      );
    }

    let values = [];
    words.forEach((word) => {
      values.push([word, this.message.guild.id]);
    });
    db.bannedWords.insert(values).then(() => {
      CensorManager.rebuildCensorshipList(this.message.guild.id);
    });

    return this.inputChannel.watchSend(
      `You won't see these words again: ${words}`
    );
  }
}

export default BanWord;
