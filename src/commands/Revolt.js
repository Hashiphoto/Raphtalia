import Discord from "discord.js";

import Command from "./Command.js";

class Revolt extends Command {
  execute() {
    return this.inputChannel.watchSend("This feature hasn't been developed yet");
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Revolt`");
  }
}

export default Revolt;
