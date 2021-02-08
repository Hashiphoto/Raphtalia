import { DMChannel, GuildMember, Message, TextChannel } from "discord.js";

import ExecutionContext from "./structures/ExecutionContext";
import Question from "./structures/Question";

/**
 * Send a message and wait for the first matching response. If no responses are recieved within the
 * timeout, a 'time' exception is thrown
 */
export default async function watchSendTimedMessage(
  context: ExecutionContext,
  member: GuildMember,
  question: Question,
  showDuration = true
): Promise<Message | undefined> {
  const text = formatText(member, question, showDuration);
  var re = new RegExp(question.answer ?? ".*", "gi");
  const filter = (message: Message) =>
    message.content.match(re) != null && message.author.id === member.id;
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

export const sendTimedMessageInChannel = (
  channel: DMChannel | TextChannel,
  member: GuildMember,
  question: Question,
  showDuration = true
) => {
  const text = formatText(member, question, showDuration);
  var re = new RegExp(question.answer ?? ".*", "gi");
  const filter = (message: Message) =>
    message.content.match(re) != null && message.author.id === member.id;
  return channel
    .send(text)
    .then(() => {
      return channel.awaitMessages(filter, {
        max: 1,
        time: question.timeout,
        errors: ["time"],
      });
    })
    .then((collected) => {
      return collected.first();
    });
};

const formatText = (member: GuildMember, question: Question, showDuration: boolean) => {
  let text = `${member.toString()} `;
  if (showDuration && question.timeout) {
    text += `\`(${question.timeout / 1000}s)\`\n`;
  }
  text += question.prompt;
  return text;
};
