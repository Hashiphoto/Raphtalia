import Command from "./Command.js";
import GuildController from "../controllers/GuildController.js";
import ServerStatusUpdater from "../ServerStatusUpdater.js";

class ServerStatus extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {GuildController} guildController
   * @param {ServerStatusUpdater} serverStatusUpdater
   */
  constructor(message, guildController, serverStatusUpdater) {
    super(message);
    this.guildController = guildController;
    this.serverStatusUpdater = serverStatusUpdater;
  }

  async execute() {
    const statusEmbed = await this.serverStatusUpdater.generateServerStatus(this.message.guild);

    this.guildController
      .removeStatusMessage()
      .then(() => {
        // Post the new status message
        return this.inputChannel.send({ embed: statusEmbed });
      })
      .then((message) => {
        // Update the status message in the this.db
        message.pin();
        return this.guildController.setStatusMessageId(message.id);
      });
  }
}

export default ServerStatus;
