import Discord from "discord.js";

import Command from "./Command.js";
import ChannelController from "../controllers/ChannelController.js";
import Format from "../Format.js";

class AutoDelete extends Command {
  /**
   * @param {Discord.Message} message
   * @param {ChannelController} channelController
   */
  constructor(message, channelController) {
    super(message);
    this.channelController = channelController;
    this.instructions =
      "**AutoDelete**\nEnable or disable automatic message deletion in this channel. If deletion delay is not specified, default 2000ms will be used";
    this.usage = "Usage: `AutoDelete (start|stop) [1ms]`";
  }

  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    const start = this.message.args.includes("start");
    const stop = this.message.args.includes("stop");
    const durationMs = Format.parseTime(this.message.content);

    // Ensure start or stop is specified but not both
    if (start && stop) {
      return this.sendHelpMessage("Please specify only one of `start` or `stop`");
    }
    if (!start && !stop) {
      return this.sendHelpMessage("Please specify `start` or `stop`");
    }
    if (start && durationMs == null) {
      return this.sendHelpMessage(
        "Please use a time format to specify how long to wait before deleting messages in this channel. E.g.: `3s` or `1500ms`"
      );
    }

    return this.channelController
      .setAutoDelete(start, durationMs)
      .then(() => {
        var response = start
          ? `Messages are deleted after ${durationMs}ms`
          : "Messages are no longer deleted";
        this.inputChannel.setTopic(response);
        return this.inputChannel.watchSend(response);
      })
      .then(() => this.useItem());
  }
}

export default AutoDelete;
