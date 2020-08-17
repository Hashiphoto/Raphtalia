import Discord from "discord.js";
import links from "../../resources/links.js";
import GuildBasedController from "./GuildBasedController.js";

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
}

export default GuildController;

/**
 *
 * @param {Discord.TextChannel} channel - The channel to send invites from and replies. If channel is null, invites are sent from the system channel
 * @param {Discord.GuildMember} target - The member to softkick
 * @param {String} reason - The message to send to the kicked member
 */
export function softkickMember(channel, target, reason = "") {
  let inviteChannel = channel;
  if (!channel) {
    inviteChannel = target.guild.systemChannel;
  }
  inviteChannel
    .createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
    .then((invite) => {
      return target.send(reason + "\n" + invite.toString());
    })
    .then(() => {
      return target.kick();
    })
    .then((member) => {
      let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
      let kickGif = links.gifs.kicks[randInt];
      if (channel)
        return channel.watchSend(
          `:wave: ${member.displayName} has been kicked and invited back\n${kickGif}`
        );
    })
    .catch((e) => {
      console.error(e);
      if (channel) channel.watchSend("Something went wrong...");
    });
}
