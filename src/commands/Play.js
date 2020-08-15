import Discord from "discord.js";

import Command from "./Command.js";
import links from "../../resources/links.js";
import youtube from "../youtube.js";

class Play extends Command {
  execute() {
    let voiceChannel = null;
    let volume = 0.5;
    // Remove the command
    let content = this.message.content.replace(/!\w+/, "");

    // Check if volume was specified
    let volRegex = /\b\d+(\.\d*)?v/;
    let volMatches = content.match(volRegex);
    if (volMatches != null) {
      volume = parseFloat(volMatches[0]);
      // Remove the volume from the string
      content = content.replace(volRegex, "");
    }

    // Check if channel was specified
    let firstMatch = null;
    let secondMatch = null;
    let matches = content.match(/\bin [-\w ]+/); // Everything from the "in " until the first slash (/)
    if (matches != null) {
      // Parameters are restricted permission
      firstMatch = matches[0].slice(3).trim(); // remove the "in "
      matches = content.match(/\/[\w ]+/); // Everything after the first slash (/), if it exists

      // The first match is the category and the second match is the channel name
      if (matches != null) {
        // remove the "in "
        secondMatch = matches[0].slice(1).trim();
        voiceChannel = this.message.guild.channels.find(
          (channel) =>
            channel.type == "voice" &&
            channel.name.toLowerCase() === secondMatch.toLowerCase() &&
            channel.parent &&
            channel.parent.name.toLowerCase() === firstMatch.toLowerCase()
        );
        if (voiceChannel == null) {
          if (this.inputChannel)
            this.inputChannel.watchSend(
              "I couldn't find a voice channel by that name"
            );
          return;
        }
      }

      // If there is second parameter, then firstMatch is the voice channel name
      else {
        voiceChannel = this.message.guild.channels.find(
          (channel) =>
            channel.type == "voice" &&
            channel.name.toLowerCase() === firstMatch.toLowerCase()
        );
        if (voiceChannel == null) {
          if (this.inputChannel)
            this.inputChannel.watchSend(
              "I couldn't find a voice channel by that name"
            );
          return;
        }
      }
    }

    // If no voice channel was specified, play the song in the vc the sender is in
    if (voiceChannel == null) {
      voiceChannel = this.message.sender.voiceChannel;

      if (!voiceChannel) {
        if (this.inputChannel)
          return this.inputChannel.watchSend(
            "Join a voice channel first, comrade!"
          );
        return;
      }
    }
    const permissions = voiceChannel.permissionsFor(
      this.message.sender.client.user
    );
    if (
      !permissions.has("VIEW_CHANNEL") ||
      !permissions.has("CONNECT") ||
      !permissions.has("SPEAK")
    ) {
      return this.inputChannel.watchSend(
        "I don't have permission to join that channel"
      );
    }
    return youtube.play(voiceChannel, links.youtube.anthem, volume);
  }
}

export default Play;
