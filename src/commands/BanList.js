import Command from "./Command.js";
import BanListStatusController from "../controllers/message/BanListStatusController.js";

class BanList extends Command {
  /**
   * @param {Discord.Message} message
   * @param {BanListStatusController} banListStatusCtlr
   */
  constructor(message, banListStatusCtlr) {
    super(message);
    this.banListStatusCtlr = banListStatusCtlr;
    this.instructions = "**BanList**\nPost the Banned Words List in this channel";
    this.usage = "Usage: `BanList`";
  }

  execute() {
    return this.banListStatusCtlr
      .removeMessage()
      .then(() => {
        return this.banListStatusCtlr.generateEmbed();
      })
      .then((embed) => {
        return this.inputChannel.send({ embed: embed });
      })
      .then((message) => {
        message.pin();
        return this.banListStatusCtlr.setMessage(message.id);
      })
      .then(() => this.useItem());
  }
}

export default BanList;
