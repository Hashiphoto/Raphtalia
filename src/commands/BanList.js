import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";
import { listFormat } from "../controllers/format.js";

class BanList extends Command {
  execute() {
    const censorController = new CensorController(this.db, this.guild);
    censorController
      .getAllBannedWords()
      .then(listFormat(words))
      .then(
        this.inputChannel.watchSend(`Here are all the banned words: ${banList}`)
      );
  }
}

export default BanList;
