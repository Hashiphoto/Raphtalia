import Discord from "discord.js";
import Question from "./structures/Question.js";

/**
 * Send a message and wait for the first matching response. If no responses are recieved within the timeout,
 * a 'time' exception is thrown
 *
 * @param {Discord.TextChannel} channel - The channel to send the message and listen for responses
 * @param {Discord.GuildMember} member - The only guildMember to listen for responses
 * @param {Question} question - The question and answer object
 * @returns {Promise<Discord.Message>} On fulfilled, returns a collection of messages received
 */
function sendTimedMessage(channel, member, question, showDuration = true) {
  var re = new RegExp(question.answer, "gi");
  const filter = function (message) {
    return message.content.match(re) != null && message.author.id === member.id;
  };
  let text = `${member} `;
  if (showDuration) {
    text += `\`(${question.timeout / 1000}s)\`\n`;
  }
  text += question.prompt;
  return channel
    .send(text)
    .then(() => {
      // Get the first message that matches the filter. Errors out if the time limit is reached
      return channel.awaitMessages(filter, {
        maxMatches: 1,
        time: question.timeout,
        errors: ["time"],
      });
    })
    .then((collected) => {
      return collected.first();
    });
}

export default sendTimedMessage;
