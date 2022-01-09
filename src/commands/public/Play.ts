import {
  AudioPlayer,
  AudioPlayerStatus,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} from "@discordjs/voice";
import { CommandInteraction, User as DsUser, TextChannel, VoiceChannel } from "discord.js";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { autoInjectable } from "tsyringe";

interface IPlayProps extends ICommandProps {
  url: string;
  voiceChannel?: VoiceChannel;
}

/**
 * TODO: https://github.com/discordjs/voice/blob/main/examples/music-bot/src/bot.ts
 */
@autoInjectable()
export default class Play extends Command<IPlayProps> {
  public play: (interaction: CommandInteraction) => void;
  private player: AudioPlayer;

  public constructor() {
    super();
    this.name = "Play";
    this.instructions =
      "Play the server theme in the voice channel you are in. " +
      "You can specify which voice channel to play in by voice channel name or channel group and voice channel name. ";
    this.usage = "`Play [in (Group/VoiceChannel | VoiceChannel)]`";
    this.aliases = [this.name.toLowerCase()];
    this.player = createAudioPlayer();
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Play,
        description: "Play a song in a voice channel",
        options: [
          {
            name: "song",
            description: "The YouTube URL to play",
            type: "STRING",
            required: true,
          },
          {
            name: "voice-channel",
            description:
              "The Voice Channel to play the song in. Will play in the VC you are in by default",
            type: "CHANNEL",
          },
        ],
      },
    ];

    // Interaction callbacks
    this.play = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const song = interaction.options.getString("song", true);
      const voiceChannel = interaction.options.getChannel("voice-channel");
      if (interaction.channel instanceof TextChannel) {
        this.channel = interaction.channel;
      }
      interaction.reply({ content: `Playing...` });
      this.runWithItem({ initiator, url: song, voiceChannel: voiceChannel as VoiceChannel });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    await this.reply(`Use the slash command /play instead`);
    return;
  }

  public async execute({ initiator, url, voiceChannel }: IPlayProps): Promise<number | undefined> {
    // If no voice channel was specified, play the song in the vc the sender is in
    if (!voiceChannel) {
      voiceChannel = (initiator.voice.channel as VoiceChannel) ?? undefined;
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
    try {
      const connection = await this.connectToChannel(voiceChannel);
      connection.subscribe(this.player);
      await this.playSong(url);
      await this.reply("Playing now!");
    } catch (error) {
      console.error(error);
    }
  }

  async connectToChannel(channel: VoiceChannel): Promise<VoiceConnection> {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
      return connection;
    } catch (error) {
      connection.destroy();
      throw error;
    }
  }

  async playSong(url: string): Promise<AudioPlayer> {
    const resource = createAudioResource(url, {
      inputType: StreamType.Arbitrary,
    });
    this.player.play(resource);
    return entersState(this.player, AudioPlayerStatus.Playing, 5e3);
  }
}
