import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";
import { listFormat } from "../controllers/format.js";

class BanList extends Command {
  execute() {
    const censorController = new CensorController(this.db, this.guild);
    censorController
      .getAllBannedWords()
      .then((words) => listFormat(words))
      .then((banList) => this.inputChannel.watchSend(`Here are all the banned words: ${banList}`));
  }
}

export default BanList;
