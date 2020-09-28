import Command from "./Command.js";
import RoleStatusController from "../controllers/RoleStatusController.js";

class Roles extends Command {
  /**
   * @param {Discord.Message} message
   * @param {RoleStatusController} roleStatusCtlr
   */
  constructor(message, roleStatusCtlr) {
    super(message);
    this.roleStatusCtlr = roleStatusCtlr;
    this.instructions = "**Roles**\nPost the roles list for this server in this channel";
    this.usage = "Usage: `Roles`";
  }

  execute() {
    // Remove the current message and post the new one
    return this.roleStatusCtlr
      .removeMessage()
      .then(() => {
        return this.roleStatusCtlr.generateEmbed();
      })
      .then((roleEmbed) => {
        return this.inputChannel.send({ embed: roleEmbed });
      })
      .then((message) => {
        message.pin();
        return this.roleStatusCtlr.setMessage(message.id);
      })
      .then(() => this.useItem());
  }
}

export default Roles;
