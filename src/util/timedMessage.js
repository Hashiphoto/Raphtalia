import Discord from "discord.js";

/**
 * Send a message and wait for the first matching response. If no responses are recieved within the timeout,
 * a 'time' exception is thrown
 *
 * @param {Discord.TextChannel} channel - The channel to send the message and listen for responses
 * @param {Discord.GuildMember} member - The only guildMember to listen for responses
 * @param {Object} question - The question and answer object
 * @param {String} question.prompt - The question to ask
 * @param {String} question.answer - The accepted answer that will be accepted on a RegEx match (case insensitive)
 * @param {number} question.timeout - The timeout in milliseconds before a 'time' exception is thrown
 * @returns {Promise<Discord.Collection<String, Discord.Message>>} On fulfilled, returns a collection of messages received
 */
function sendTimedMessage(channel, member, question, showDuration = true) {
  if (!channel) return;
  const filter = function (message) {
    var re = new RegExp(question.answer, "gi");
    return message.content.match(re) != null && message.author.id === member.id;
  };
  let text = "";
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
      return collected.first().content;
    });
}

export default sendTimedMessage;
