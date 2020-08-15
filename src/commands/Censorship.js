import db from "./db/db.js";
import Command from "./Command.js";
import CensorManager from "../CensorManager.js";

class Censorship extends Command {
  execute() {
    if (this.message.args.length == 0) {
      return this.sendHelpMessage();
    }

    let isCensoring;
    const text = this.message.args[0].toLowerCase();
    if (text == "enabled") {
      isCensoring = true;
    } else if (text == "disabled") {
      isCensoring = false;
    } else {
      return this.sendHelpMessage();
    }

    db.guilds.setCensorship(message.guild.id, isCensoring).then(() => {
      if (isCensoring) {
        return this.inputChannel.watchSend("Censorship is enabled");
      } else {
        return this.inputChannel.watchSend("All speech is permitted!");
      }
    });
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend(
      "Try again and specify if censorship is enabled or disabled.\nE.g. `Censorship enable`"
    );
  }
}

export default Censorship;
