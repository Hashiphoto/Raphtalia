import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import StoreStatusController from "../../services/message/StoreStatusController";

export default class Store extends Command {
  /**
   * @param {Discord.Message} message
   * @param {StoreStatusController} storeStatusCtlr
   */
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Store**\nPost the server store in this channel";
    this.usage = "Usage: `Store`";
  }

  public async execute(): Promise<any> {
    // Remove the current message and post the new one
    return this.ec.storeStatusController
      .removeMessage()
      .then(() => {
        return this.ec.storeStatusController.generateEmbed();
      })
      .then((storeEmbed) => {
        return this.ec.channel.send({ embed: storeEmbed });
      })
      .then((message) => {
        message.pin();
        return this.ec.storeStatusController.setMessage(message.id);
      })
      .then(() => this.useItem());
  }
}
