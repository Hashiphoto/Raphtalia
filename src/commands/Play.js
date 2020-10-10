import Discord from "discord.js";

import Command from "./Command.js";
import links from "../../resources/links.js";
import RNumber from "../structures/RNumber.js";
import ytdl from "ytdl-core";

class Play extends Command {
  constructor(message) {
    super(message);
    this.instructions =
      "**Play**\nPlay the server theme in the voice channel you are in. " +
      "You can specify which voice channel to play in by voice channel name or channel group and voice channel name. " +
      "You can change the volume by specifying a percentage.";
    this.usage = "Usage: `Play [in (Group/VoiceChannel | VoiceChannel)] [100%]`";
  }
  execute() {
    let content = this.message.content;
    let volume = this.getVolume(content);
    if (volume == null) {
      return this.sendHelpMessage("Please specify volume as a percentage. `Play 70%`");
    }

    let voiceChannel = this.getVoiceChannel(content);

    // If no voice channel was specified, play the song in the vc the sender is in
    if (voiceChannel == null) {
      voiceChannel = this.message.sender.voiceChannel;

      if (!voiceChannel) {
        return this.sendHelpMessage("Join a voice channel or specify which one to play in");
      }
    }

    const permissions = voiceChannel.permissionsFor(this.message.sender.client.user);
    if (
      !permissions.has("VIEW_CHANNEL") ||
      !permissions.has("CONNECT") ||
      !permissions.has("SPEAK")
    ) {
      return this.sendHelpMessage(`I don't have permission to join ${voiceChannel.name}`);
    }

    return this.play(voiceChannel, links.youtube.anthem, volume).then(() => this.useItem());
  }

  /**
   * Play a song in the specified VoiceChannel
   *
   * @param {Discord.VoiceChannel} voiceChannel - The voice channel to play the yt song in
   * @param {String} url - The url of the YouTube video to play
   * @param {number} vol - The volume to play at (0 to 1)
   */
  play(voiceChannel, url, vol) {
    return voiceChannel
      .join()
      .then((connection) => {
        const stream = ytdl(url, {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 25,
        });
        const dispatcher = connection.playStream(stream, {
          volume: vol,
          highWaterMark: 1,
        });

        dispatcher.on("end", () => voiceChannel.leave());
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getVolume(text) {
    const rVolume = RNumber.parse(text);
    if (!rVolume) {
      return 0.5;
    }

    if (rVolume.type === RNumber.types.PERCENT) {
      return rVolume.amount;
    } else {
      return null;
    }
  }

  getVoiceChannel(content) {
    let matches = content.match(/in ([\w -]+)(\/([\w -]+))?/i);

    if (!matches) {
      return null;
    }

    /**
     * There are two accepted formats. If the parent and voice channel are both
     * included, it should look like:
     *    FOLDER / CHANNEL NAME
     * Where the folder is index 1 and channel name is index 3
     *
     * If only the voice channel is included, it should look like:
     *    CHANNEL NAME
     * Where the channel name is index 1
     *
     * We test which format is given by the length of the match array
     */

    // Folder and channel name
    if (matches[2]) {
      const folderName = matches[1].trim();
      const channelName = matches[3].trim();

      return this.guild.channels.find(
        (channel) =>
          channel.type == "voice" &&
          channel.name.toLowerCase() === channelName.toLowerCase() &&
          channel.parent &&
          channel.parent.name.toLowerCase() === folderName.toLowerCase()
      );
    }

    // Just channel name
    const channelName = matches[1].trim();

    return this.guild.channels.find(
      (channel) =>
        channel.type == "voice" && channel.name.toLowerCase() === channelName.toLowerCase()
    );
  }
}

export default Play;
