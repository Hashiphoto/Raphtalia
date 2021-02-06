import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import Util from "../Util.js";

export default class AutoDelete extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**AutoDelete**\nEnable or disable automatic message deletion in this channel. If deletion delay is not specified, default 2000ms will be used";
    this.usage = "Usage: `AutoDelete (start|stop) [1ms]`";
  }

  public async execute(): Promise<any> {
    if (!this.ec.messageHelper.args || this.ec.messageHelper.args.length === 0) {
      return this.sendHelpMessage();
    }

    const start = this.ec.messageHelper.args.includes("start");
    const stop = this.ec.messageHelper.args.includes("stop");
    let durationMs = Util.parseTime(this.ec.messageHelper.parsedContent);

    // Ensure start or stop is specified but not both
    if (start && stop) {
      return this.sendHelpMessage("Please specify only one of `start` or `stop`");
    }
    if (!start && !stop) {
      return this.sendHelpMessage("Please specify `start` or `stop`");
    }
    if (start && durationMs === undefined) {
      return this.sendHelpMessage(
        "Please use a time format to specify how long to wait before deleting messages in this channel. E.g.: `3s` or `1500ms`"
      );
    }
    if (durationMs === undefined) {
      durationMs = -1;
    }

    return this.ec.channelController
      .setAutoDelete(durationMs)
      .then(() => {
        var response = start
          ? `Messages are deleted after ${durationMs}ms`
          : "Messages are no longer deleted";
        this.ec.channel.setTopic(response);
        return this.ec.channelHelper.watchSend(response);
      })
      .then(() => this.useItem());
  }
}
