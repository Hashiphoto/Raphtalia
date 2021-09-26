import { Client } from "discord.js";
import MemberService from "../services/Member.service";
import MessageService from "../services/Message.service";
import OnboardingService from "../services/Onboarding.service";
import { container } from "tsyringe";

export default (client: Client): void => {
  const messageService = container.resolve(MessageService);
  const memberService = container.resolve(MemberService);
  const onboardingService = container.resolve(OnboardingService);

  client.on("messageCreate", async (message) => {
    messageService.handleMessage(message);
  });

  client.on("guildMemberAdd", async (member) => {
    onboardingService.onBoard(member);
  });

  client.on("guildMemberRemove", (member) => {
    onboardingService.offboard(member);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    memberService.handleMemberUpdate(oldMember, newMember);
  });

  client.on("messageReactionAdd", (messageReaction, user) => {
    messageService.handleReactionAdd(messageReaction, user);
  });

  client.on("messageReactionRemove", (messageReaction, user) => {
    messageService.handleReactionRemove(messageReaction, user);
  });

  // /**
  //  * "raw" has to be used since "messageReactionAdd" only applies to cached messages. This will make sure that all
  //  * reactions emit an event
  //  * Derived from https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md
  //  */
  // client.on("raw", async (packet) => {
  //   if (!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)) return;
  //   const channel = client.channels.cache.get(packet.d.channel_id);
  //   if (
  //     !channel ||
  //     !(channel instanceof TextChannel) ||
  //     channel.messages.cache.has(packet.d.message_id)
  //   ) {
  //     return;
  //   }
  //   const message = await channel.messages.fetch(packet.d.message_id);
  //   const emoji = packet.d.emoji.id
  //     ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
  //     : packet.d.emoji.name;
  //   const reaction = message.reactions.cache.get(emoji);
  //   const user = await client.users.cache.get(packet.d.user_id);
  //   if (!reaction || !user) {
  //     return;
  //   }
  //   reaction.users.cache.set(packet.d.user_id, user);
  //   if (packet.t === "MESSAGE_REACTION_ADD") {
  //     client.emit("messageReactionAdd", reaction, user);
  //   }
  //   // If the message reactions weren't cached, pass in the message instead
  //   else if (packet.t === "MESSAGE_REACTION_REMOVE") {
  //     client.emit("messageReactionRemove", reaction, user);
  //   }
  // });
};
