import {
  Guild as DsGuild,
  User as DsUser,
  GuildMember,
  TextChannel,
  VoiceChannel,
} from "discord.js";

import ClientService from "../services/Client.service";
import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import links from "../../resources/links";
import ytdl from "ytdl-core";

@autoInjectable()
export default class Play extends Command {
  public constructor(private clientService?: ClientService) {
    super();
    this.instructions =
      "**Play**\nPlay the server theme in the voice channel you are in. " +
      "You can specify which voice channel to play in by voice channel name or channel group and voice channel name. ";
    this.usage = "Usage: `Play [in (Group/VoiceChannel | VoiceChannel)]`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    const voiceChannel = this.parseVoiceChannel(
      cmdMessage.message.member.guild,
      cmdMessage.parsedContent
    );

    return this.execute(cmdMessage.message.member, voiceChannel);
  }

  public async execute(initiator: GuildMember, voiceChannel?: VoiceChannel): Promise<any> {
    // const content = this.ec.messageHelper.parsedContent;
    // TODO: fix percentage parsing
    // const lastArg = this.message.args[this.message.args.length - 1];
    // let volume = this.getVolume(lastArg);
    // if (volume == null) {
    //   return this.sendHelpMessage("Please specify volume as a percentage. `Play 70%`");
    // }
    const volume = 0.5;

    // let voiceChannel = this.getVoiceChannel(content);

    // If no voice channel was specified, play the song in the vc the sender is in
    if (!voiceChannel) {
      voiceChannel = initiator.voice.channel ?? undefined;

      if (!voiceChannel) {
        return this.sendHelpMessage("Join a voice channel or specify which one to play in");
      }
    }

    const permissions = voiceChannel.permissionsFor(this.clientService?.getClient().user as DsUser);
    if (
      !permissions ||
      !permissions.has("VIEW_CHANNEL") ||
      !permissions.has("SPEAK") ||
      !permissions.has("CONNECT")
    ) {
      return this.sendHelpMessage(`I don't have permission to join ${voiceChannel.name}`);
    }

    return this.play(voiceChannel, links.youtube.anthem, volume).then(() =>
      this.useItem(initiator)
    );
  }

  /**
   * Play a song in the specified VoiceChannel
   *
   * @param {Discord.VoiceChannel} voiceChannel - The voice channel to play the yt song in
   * @param {string} url - The url of the YouTube video to play
   * @param {number} vol - The volume to play at (0 to 1)
   */
  private async play(voiceChannel: VoiceChannel, url: string, vol: number): Promise<void> {
    const connection = await voiceChannel.join();
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
  }

  // private getVolume(text: string) {
  //   const rVolume = RNumber.parse(text);
  //   if (!rVolume) {
  //     return 0.5;
  //   }

  //   if (rVolume.type === RNumber.Types.PERCENT) {
  //     return rVolume.amount;
  //   } else {
  //     return null;
  //   }
  // }

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
  private parseVoiceChannel(guild: DsGuild, content: string): VoiceChannel | undefined {
    const matches = content.match(/in ([\w -]+)(\/([\w -]+))?/i);

    if (!matches) {
      return;
    }

    // Folder and channel name
    if (matches[2]) {
      const folderName = matches[1].trim();
      const channelName = matches[3].trim();

      return guild.channels.cache.find(
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

    return guild.channels.cache.find(
      (channel) =>
        channel.type == "voice" && channel.name.toLowerCase() === channelName.toLowerCase()
    ) as VoiceChannel;
  }
}
