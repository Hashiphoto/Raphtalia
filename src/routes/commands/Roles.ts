import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";

export default class Roles extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Roles**\nPost the roles list for this server in this channel";
    this.usage = "Usage: `Roles`";
  }

  public async execute(): Promise<any> {
    // Remove the current message and post the new one
    return this.ec.roleStatusController
      .removeMessage()
      .then(() => {
        return this.ec.roleStatusController.generateEmbed();
      })
      .then((roleEmbed) => {
        return this.ec.channel.send({ embed: roleEmbed });
      })
      .then((message) => {
        message.pin();
        return this.ec.roleStatusController.setMessage(message.id);
      })
      .then(() => this.useItem());
  }
}
