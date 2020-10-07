import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Debug extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions = "For testing in development only";
    this.usage = "Usage: `Debug (option)`";
  }

  async execute() {
    if (this.message.args.length === 0) {
      return this.sendHelpMessage();
    }
    switch (this.message.args[0].toLowerCase()) {
      case "resolvecontests":
        return this.memberController
          .resolveRoleContests()
          .then((responses) => responses.reduce(this.sum))
          .then((feedback) => this.inputChannel.watchSend(feedback));
      default:
        return this.sendHelpMessage();
    }
  }
}

export default Debug;
