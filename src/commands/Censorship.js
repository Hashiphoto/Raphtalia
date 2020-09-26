import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";

class Censorship extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {GuildController} guildController
   */
  constructor(message, guildController) {
    super(message);
    this.guildController = guildController;
  }

  execute() {
    const start = this.message.args.includes("start");
    const stop = this.message.args.includes("stop");

    if ((start && stop) || (!start && !stop)) {
      return this.sendHelpMessage("Please specify either `start` or `stop`");
    }

    return this.guildController
      .setCensorship(start)
      .then(() => {
        if (start) {
          return this.inputChannel.watchSend("Censorship is enabled");
        } else {
          return this.inputChannel.watchSend("All speech is permitted!");
        }
      })
      .then(() => this.useItem());
  }

  sendHelpMessage(pretext = "") {
    return this.inputChannel.watchSend(`${pretext}\n` + "Usage: `Censorship (start|stop)`");
  }
}

export default Censorship;
