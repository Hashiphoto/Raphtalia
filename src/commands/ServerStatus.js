import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";
import ServerStatusUpdater from "../ServerStatusUpdater.js";

class ServerStatus extends Command {
  async execute() {
    const serverStatusUpdater = new ServerStatusUpdater(this.db, this.guild);
    const statusEmbed = await serverStatusUpdater.generateServerStatus(this.message.guild);

    const guildController = new GuildController(this.db, this.guild);
    guildController
      .removeStatusMessage()
      .then(() => {
        // Post the new status message
        return this.inputChannel.send({ embed: statusEmbed });
      })
      .then((message) => {
        // Update the status message in the this.db
        message.pin();
        return guildController.setStatusMessageId(message.id);
      });
  }
}

export default ServerStatus;
