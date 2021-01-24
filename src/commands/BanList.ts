import BanListStatusController from "../controllers/message/BanListStatusController.js";
import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class BanList extends Command {
  constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**BanList**\nPost the Banned Words List in this channel";
    this.usage = "Usage: `BanList`";
  }

  async execute(): Promise<any> {
    await this.ec.banListStatusController.removeMessage();
    const embed = await this.ec.banListStatusController.generateEmbed();

    this.ec.channel
      .send({ embed: embed })
      .then((message) => {
        message.pin();
        this.ec.banListStatusController.setMessage(message.id);
      })
      .then(() => this.useItem());
  }
}
