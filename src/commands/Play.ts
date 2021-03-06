import Discord, { VoiceChannel } from "discord.js";

import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import RNumber from "../structures/RNumber";
import links from "../../resources/links";
import ytdl from "ytdl-core";

export default class Play extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Play**\nPlay the server theme in the voice channel you are in. " +
      "You can specify which voice channel to play in by voice channel name or channel group and voice channel name. ";
    this.usage = "Usage: `Play [in (Group/VoiceChannel | VoiceChannel)]`";
  }

  public async execute(): Promise<any> {
    let content = this.ec.messageHelper.parsedContent;
    // TODO: fix percentage parsing
    // const lastArg = this.message.args[this.message.args.length - 1];
    // let volume = this.getVolume(lastArg);
    // if (volume == null) {
    //   return this.sendHelpMessage("Please specify volume as a percentage. `Play 70%`");
    // }
    let volume = 0.5;

    let voiceChannel = this.getVoiceChannel(content);

    // If no voice channel was specified, play the song in the vc the sender is in
    if (!voiceChannel) {
      voiceChannel = this.ec.initiator.voice.channel ?? undefined;

      if (!voiceChannel) {
        return this.sendHelpMessage("Join a voice channel or specify which one to play in");
      }
    }

    const permissions = voiceChannel.permissionsFor(this.ec.raphtalia);
    if (
      permissions &&
      permissions.has("VIEW_CHANNEL") &&
      permissions.has("SPEAK") &&
      permissions.has("CONNECT")
    ) {
      return this.play(voiceChannel, links.youtube.anthem, volume).then(() => this.useItem());
    }

    return this.sendHelpMessage(`I don't have permission to join ${voiceChannel.name}`);
  }

  /**
   * Play a song in the specified VoiceChannel
   *
   * @param {Discord.VoiceChannel} voiceChannel - The voice channel to play the yt song in
   * @param {string} url - The url of the YouTube video to play
   * @param {number} vol - The volume to play at (0 to 1)
   */
  private play(voiceChannel: VoiceChannel, url: string, vol: number) {
    return voiceChannel
      .join()
      .then((connection) => {
        const stream = ytdl(url, {
          filter: "audioonly",
          quality: "lowestaudio",
          highWaterMark: 1 << 20,
        });
        const dispatcher = connection.play(stream, {
          volume: vol,
          highWaterMark: 1,
        });

        dispatcher.on("finish", () => voiceChannel.leave());
      })
      .catch((error) => {
        console.log(error);
      });
  }

  private getVolume(text: string) {
    const rVolume = RNumber.parse(text);
    if (!rVolume) {
      return 0.5;
    }

    if (rVolume.type === RNumber.Types.PERCENT) {
      return rVolume.amount;
    } else {
      return null;
    }
  }

  private getVoiceChannel(content: string): VoiceChannel | undefined {
    let matches = content.match(/in ([\w -]+)(\/([\w -]+))?/i);

    if (!matches) {
      return;
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

      return this.ec.guild.channels.cache.find(
        (channel) =>
          !!(
            channel.type == "voice" &&
            channel.name.toLowerCase() === channelName.toLowerCase() &&
            channel.parent &&
            channel.parent.name.toLowerCase() === folderName.toLowerCase()
          )
      ) as VoiceChannel;
    }

    // Just channel name
    const channelName = matches[1].trim();

    return this.ec.guild.channels.cache.find(
      (channel) =>
        channel.type == "voice" && channel.name.toLowerCase() === channelName.toLowerCase()
    ) as VoiceChannel;
  }
}
