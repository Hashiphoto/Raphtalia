import BanListStatusController from "../controllers/message/BanListStatusController.js";
import CensorController from "../controllers/CensorController.js";
import Command from "./Command.js";
import {Message} from "discord.js";

class AllowWord extends Command {
  censorController: CensorController;
  banlistStatusCtlr: BanListStatusController;
  instructions: string;
  usage: string;
  message: any;
  item: any;
  inputChannel: any;
  constructor(message: Message, censorController: CensorController, banlistStatusCtlr: BanListStatusController) {
    super(message);
    this.censorController = censorController;
    this.banlistStatusCtlr = banlistStatusCtlr;
    this.instructions = "**AllowWord**\nRemove a word from the ban list";
    this.usage = "Usage: `AllowWord word1 word2 etc`";
  }

  execute() {
    // TODO: Check if censorship is enabled at all
    let words = this.message.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    return this.censorController
      .deleteWords(words)
      .then(() => this.banlistStatusCtlr.update())
      .then(() => this.inputChannel.watchSend("Banned words list has been updated"))
      .then(() => this.useItem(words.length));
  }
}

export default AllowWord;
