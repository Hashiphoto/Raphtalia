import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";

class Censorship extends Command {
  execute() {
    if (this.message.args.length == 0) {
      return this.sendHelpMessage();
    }

    let isCensoring;
    const text = this.message.args[0].toLowerCase();
    if (text == "enable") {
      isCensoring = true;
    } else if (text == "disable") {
      isCensoring = false;
    } else {
      return this.sendHelpMessage();
    }

    let guildController = new GuildController(this.db, this.message.guild);
    guildController.setCensorship(isCensoring).then(() => {
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
