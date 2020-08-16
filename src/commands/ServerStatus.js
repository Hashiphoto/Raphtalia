import Command from "./Command.js";
import db from "../db/Database.js";
import { generateServerStatus } from "../util/serverStatus.js";
import { verifyPermission } from "../util/roleManagement.js";

class Template extends Command {
  async execute() {
    const statusEmbed = await generateServerStatus(this.message.guild);

    db.guilds
      .get(this.message.guild.id)
      .then(async (guild) => {
        // Delete the existing status message, if it exists
        if (!guild || !guild.status_message_id) {
          return;
        }
        let textChannels = this.message.guild.channels
          .filter((channel) => channel.type === "text" && !channel.deleted)
          .array();
        for (let i = 0; i < textChannels.length; i++) {
          try {
            let oldStatusMessage = await textChannels[i].fetchMessage(
              guild.status_message_id
            );
            oldStatusMessage.delete();
            return;
          } catch (e) {}
        }
      })
      .then(() => {
        // Post the new status message
        return this.inputChannel.send({ embed: statusEmbed });
      })
      .then((newStatusMessage) => {
        // Update the status message in the db
        newStatusMessage.pin();
        return db.guilds.setStatusMessage(
          newStatusMessage.guild.id,
          newStatusMessage.id
        );
      });
  }
}

export default Template;
