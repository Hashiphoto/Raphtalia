import Discord from "discord.js";

import Command from "./Command.js";
import db from "../db/Database.js";
import CensorManager from "../CensorManager.js";

class AllowWord extends Command {
  execute() {
    // TODO: Check if censorship is enabled at all

    let words = this.message.args;
    if (words.length === 0) {
      return this.inputChannel.watchSend(
        "Try again and specify what words will be allowed. E.g. `AllowWord cat dog apple`"
      );
    }

    db.bannedWords.delete(this.message.guild.id, words).then(() => {
      CensorManager.rebuildCensorshipList(this.message.guild.id);
    });
    return this.inputChannel.watchSend(
      `These words are allowed again: ${words}`
    );
  }
}

export default AllowWord;
