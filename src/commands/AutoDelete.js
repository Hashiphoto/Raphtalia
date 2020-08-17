import Discord from "discord.js";

import Command from "./Command.js";
import ChannelController from "../controllers/ChannelController.js";

class AutoDelete extends Command {
  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.inputChannel.watchSend(
        "Usage: `AutoDelete (start|stop) [delete delay ms]`\nIf delete delay is not specified, default 2000ms will be used"
      );
    }

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
      return this.inputChannel.watchSend(
        "Usage: `AutoDelete (start|stop) [delete delay ms]`"
      );
    }

    const channelController = new ChannelController(db, this.inputChannel);
    channelController.setAutoDelete(enable, deleteDelay).then(() => {
      var response = enable
        ? `Messages are deleted after ${deleteDelay}ms`
        : "Messages are no longer deleted";
      return this.inputChannel.watchSend(response);
    });
  }
}

export default AutoDelete;
