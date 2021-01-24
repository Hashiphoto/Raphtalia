import { GuildMember, Message, TextChannel } from "discord.js";

import ExecutionContext from "./structures/ExecutionContext";
import Question from "./structures/Question";

/**
 * Send a message and wait for the first matching response. If no responses are recieved within the
 * timeout, a 'time' exception is thrown
 */
export default function sendTimedMessage(
  context: ExecutionContext,
  member: GuildMember,
  question: Question,
  showDuration = true
) {
  var re = new RegExp(question.answer, "gi");
  const filter = (message: Message) =>
    message.content.match(re) != null && message.author.id === member.id;
  let text = `${member} `;
  if (showDuration) {
    text += `\`(${question.timeout / 1000}s)\`\n`;
  }
  text += question.prompt;
  return context.channelHelper
    .watchSend(text)
    .then(() => {
      return context.channelHelper.channel.awaitMessages(filter, {
        max: 1,
        time: question.timeout,
        errors: ["time"],
      });
    })
    .then((collected) => {
      return collected.first();
    });
}
