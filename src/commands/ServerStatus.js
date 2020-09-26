import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";
import ServerStatusController from "../controllers/ServerStatusController.js";

class ServerStatus extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {GuildController} guildController
   * @param {ServerStatusController} serverStatusUpdater
   */
  constructor(message, guildController, serverStatusUpdater) {
    super(message);
    this.guildController = guildController;
    this.serverStatusUpdater = serverStatusUpdater;
  }

  async execute() {
    const statusEmbed = await this.serverStatusUpdater.generateServerStatus(this.message.guild);

    return this.guildController
      .removeStatusMessage()
      .then(() => {
        // Post the new status message
        return this.inputChannel.send({ embed: statusEmbed });
      })
      .then((message) => {
        // Update the status message in the this.db
        message.pin();
        return this.guildController.setStatusMessageId(message.id);
      })
      .then(() => this.useItem());
  }
}

export default ServerStatus;
