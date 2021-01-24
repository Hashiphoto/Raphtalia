import Command from "./Command.js";
import Discord from "discord.js";

class Revolt extends Command {
  execute(): Promise<any> {
    return this.ec.channelHelper.watchSend("This feature hasn't been developed yet");
  }

  sendHelpMessage() {
    return this.ec.channelHelper.watchSend("Usage: `Revolt`");
  }
}

export default Revolt;
