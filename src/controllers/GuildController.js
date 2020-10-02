import Discord from "discord.js";
import links from "../../resources/links.js";
import GuildBasedController from "./GuildBasedController.js";
import RNumber from "../structures/RNumber.js";

class GuildController extends GuildBasedController {
  // TODO: Move to a ChannelController class?
  static async clearChannel(channel) {
    let pinnedMessages = await channel.fetchPinnedMessages();
    let fetched;
    do {
      fetched = await channel.fetchMessages({ limit: 100 });
      await channel.bulkDelete(fetched.filter((message) => !message.pinned));
    } while (fetched.size > pinnedMessages.size);
  }

  getLeaderRole(guild) {
    return guild.roles
      .filter((role) => role.hoist && role.members.size > 0)
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .first();
  }

  setCensorship(enable) {
    return this.db.guilds.setCensorship(this.guild.id, enable);
  }
}

export default GuildController;
