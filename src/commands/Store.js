import Command from "./Command.js";
import StoreStatusController from "../controllers/StoreStatusController.js";

class Store extends Command {
  /**
   * @param {Discord.Message} message
   * @param {StoreStatusController} storeStatusCtlr
   */
  constructor(message, storeStatusCtlr) {
    super(message);
    this.storeStatusCtlr = storeStatusCtlr;
  }

  execute() {
    // Remove the current message and post the new one
    return this.storeStatusCtlr
      .removeMessage()
      .then(() => {
        return this.storeStatusCtlr.generateEmbed();
      })
      .then((storeEmbed) => {
        return this.inputChannel.send({ embed: storeEmbed });
      })
      .then((message) => {
        message.pin();
        return this.storeStatusCtlr.setMessage(message.id);
      })
      .then(() => this.useItem());
  }
}

export default Store;
