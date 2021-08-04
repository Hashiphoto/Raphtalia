import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";

export default class Censorship extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Censorship**\nEnable or disable censorship for the whole server. " +
      "When censorship is enabled, anyone who uses a word from the banned " +
      "list will be given an infraction";
    this.usage = "Usage: `Censorship (start|stop)`";
  }

  public async execute(): Promise<any> {
    const start = this.ec.messageHelper.args.includes("start");
    const stop = this.ec.messageHelper.args.includes("stop");

    if ((start && stop) || (!start && !stop)) {
      return this.sendHelpMessage("Please specify either `start` or `stop`");
    }

    return this.ec.guildController
      .setCensorship(start)
      .then(() => {
        if (start) {
          return this.ec.channelHelper.watchSend("Censorship is enabled");
        } else {
          return this.ec.channelHelper.watchSend("All speech is permitted!");
        }
      })
      .then(() => this.ec.banListStatusController.update())
      .then(() => this.useItem());
  }
}
