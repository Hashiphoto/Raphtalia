"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ytdl_core_1 = __importDefault(require("ytdl-core"));
/**
 * Play a song in the specified VoiceChannel
 *
 * @param {Discord.VoiceChannel} voiceChannel - The voice channel to play the yt song in
 * @param {String} url - The url of the YouTube video to play
 * @param {number} vol - The volume to play at (0 to 1)
 */
function play(voiceChannel, url, vol) {
    return voiceChannel
        .join()
        .then((connection) => {
        const stream = ytdl_core_1.default(url, {
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
exports.default = {
    play,
};
//# sourceMappingURL=youtube.js.map