import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";
import Format from "../Format.js";

class BanList extends Command {
  execute() {
    const censorController = new CensorController(this.db, this.guild);
    censorController
      .getAllBannedWords()
      .then((words) => Format.listFormat(words))
      .then((banList) => this.inputChannel.watchSend(`Here are all the banned words: ${banList}`));
  }
}

export default BanList;
