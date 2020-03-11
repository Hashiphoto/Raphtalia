const Discord = require('discord.js');
const ytdl = require('ytdl-core');

/**
 * Play a song in the specified VoiceChannel
 * 
 * @param {Discord.VoiceChannel} voiceChannel - The voice channel to play the yt song in
 * @param {String} url - The url of the YouTube video to play
 */
function play(voiceChannel, url) {
    voiceChannel.join()
    .then(connection => {
        const stream = ytdl(url, { filter: 'audioonly' });
        const dispatcher = connection.playStream(stream);

        dispatcher.on('end', () => voiceChannel.leave());
    })
    .catch(e => {
        console.error(e);
    })
}

module.exports = {
    play
}