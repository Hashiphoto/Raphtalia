import Discord from "discord.js";

import Command from "./Command.js";
import ChannelController from "../controllers/ChannelController.js";

class AutoDelete extends Command {
  /**
   * @param {Discord.Message} message
   * @param {ChannelController} channelController
   */
  constructor(message, channelController) {
    super(message);
    this.channelController = channelController;
  }

  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    const start = this.message.args.includes("start");
    const stop = this.message.args.includes("stop");

    // Ensure start or stop is specified but not both
    if (start && stop) {
      return this.sendHelpMessage("Please specify only one of `start` or `stop`");
    }
    if (!start && !stop) {
      return this.sendHelpMessage("Please specify `start` or `stop`");
    }

    // Get the time from the message
    let enable = null;
    let deleteDelay = 2000;
    for (let i = 0; i < this.message.args.length; i++) {
      switch (this.message.args[i].toLowerCase()) {
        case "start":
          enable = true;
          break;
        case "stop":
          enable = false;
          break;
        default:
          let num = parseInt(this.message.args[i]);
          if (isNaN(num)) {
            continue;
          }
          deleteDelay = num;
      }
    }

    if (enable === null) {
      return this.sendHelpMessage();
    }

    this.channelController.setAutoDelete(enable, deleteDelay).then(() => {
      var response = enable
        ? `Messages are deleted after ${deleteDelay}ms`
        : "Messages are no longer deleted";
      return this.inputChannel.watchSend(response);
    });
  }

  sendHelpMessage(pretext = "") {
    return this.inputChannel.watchSend(
      `${pretext}\n` +
        "Usage: `AutoDelete (start|stop) [delete delay ms]`\nIf delete delay is not specified, default 2000ms will be used"
    );
  }
}

export default AutoDelete;
