import db from "./db/db.js";
import Command from "./Command.js";

class BanList extends Command {
  execute() {
    // TODO: Check if censorship is enabled at all
    db.bannedWords.getAll(this.message.guild.id).then((rows) => {
      let banList = "";
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].word.includes(" ")) {
          banList += `'${rows[i].word}'`;
        } else {
          banList += `${rows[i].word}`;
        }
        if (i !== rows.length - 1) {
          banList += ", ";
        }
      }
      if (channel)
        return channel.watchSend(`Here are all the banned words: ${banList}`);
    });
  }
}

export default BanList;
