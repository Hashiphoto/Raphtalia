import { User as DsUser, GuildMember, StageChannel, TextChannel, VoiceChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

/**
 * TODO: https://github.com/discordjs/voice/blob/main/examples/music-bot/src/bot.ts
 */
@autoInjectable()
export default class Play extends Command {
  public constructor() {
    super();
    this.name = "Play";
    this.instructions =
      "Play the server theme in the voice channel you are in. " +
      "You can specify which voice channel to play in by voice channel name or channel group and voice channel name. ";
    this.usage = "`Play [in (Group/VoiceChannel | VoiceChannel)]`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    this.reply("This command is broken right now. Blame the developer");
    // const voiceChannel = this.parseVoiceChannel(
    //   cmdMessage.message.member.guild,
    //   cmdMessage.parsedContent
    // );

    // return this.execute(cmdMessage.message.member, voiceChannel);
  }

  public async execute(
    initiator: GuildMember,
    voiceChannel?: VoiceChannel | StageChannel
  ): Promise<any> {
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

    // return this.play(voiceChannel, links.youtube.anthem, volume).then(() =>
    //   this.useItem(initiator)
    // );
  }

  //   /**
  //    * Play a song in the specified VoiceChannel
  //    */
  //   private async play(
  //     voiceChannel: VoiceChannel | StageChannel,
  //     url: string,
  //     vol: number
  //   ): Promise<void> {
  //     try {
  //       const connection = await joinVoiceChannel({guildId: voiceChannel.guildId, channelId: voiceChannel.id})
  //       const stream = ytdl(url, {
  //         filter: "audioonly",
  //         quality: "lowestaudio",
  //         highWaterMark: 1 << 20,
  //       });
  //       const dispatcher = connection.play(stream, {
  //         volume: vol,
  //         highWaterMark: 1,
  //       });
  //       dispatcher.on("finish", () => voiceChannel.leave());
  //     } catch (e) {
  //       console.error(e);
  //       voiceChannel.leave();
  //       throw e;
  //     }
  //   }

  //   /**
  //    * There are two accepted formats. If the parent and voice channel are both
  //    * included, it should look like:
  //    *    FOLDER / CHANNEL NAME
  //    * Where the folder is index 1 and channel name is index 3
  //    *
  //    * If only the voice channel is included, it should look like:
  //    *    CHANNEL NAME
  //    * Where the channel name is index 1
  //    *
  //    * We test which format is given by the length of the match array
  //    */
  //   private parseVoiceChannel(guild: DsGuild, content: string): VoiceChannel | undefined {
  //     const matches = content.match(/in ([\w -]+)(\/([\w -]+))?/i);

  //     if (!matches) {
  //       return;
  //     }

  //     // Folder and channel name
  //     if (matches[2]) {
  //       const folderName = matches[1].trim();
  //       const channelName = matches[3].trim();

  //       return guild.channels.cache.find(
  //         (channel) =>
  //           !!(
  //             channel.type == "voice" &&
  //             channel.name.toLowerCase() === channelName.toLowerCase() &&
  //             channel.parent &&
  //             channel.parent.name.toLowerCase() === folderName.toLowerCase()
  //           )
  //       ) as VoiceChannel;
  //     }

  //     // Just channel name
  //     const channelName = matches[1].trim();

  //     return guild.channels.cache.find(
  //       (channel) =>
  //         channel.type == "voice" && channel.name.toLowerCase() === channelName.toLowerCase()
  //     ) as VoiceChannel;
  //   }
}
