import Command from "./Command.js";
import CensorController from "../controllers/CensorController.js";
import Format from "../Format.js";

class BanList extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CensorController} censorController
   */
  constructor(message, censorController) {
    super(message);
    this.censorController = censorController;
  }

  execute() {
    this.censorController
      .getAllBannedWords()
      .then((words) => Format.listFormat(words))
      .then((banList) => this.inputChannel.watchSend(`Here are all the banned words: ${banList}`));
  }
}

export default BanList;
