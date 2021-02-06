import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class BanList extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**BanList**\nPost the Banned Words List in this channel";
    this.usage = "Usage: `BanList`";
  }

  public async execute(): Promise<any> {
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
