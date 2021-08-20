import { Client } from "discord.js";

export default (client: Client): void => {
  // client.on("messageReactionAdd", (messageReaction, user) => {
  //   const message = messageReaction.message;
  //   if (!user || !(message.channel instanceof TextChannel) || !message.guild) {
  //     return;
  //   }
  //   // Only pay users for their first reaction to a message
  //   if (message.reactions.cache.filter((e) => !!e.users.cache.get(user.id)).size > 1) {
  //     return;
  //   }
  //   const context = new ExecutionContext(this.db, client, message.guild)
  //     .setMessage(message)
  //     .setChannelHelper(new ChannelHelper(message.channel, -1));
  //   const guildMember = context.guild.members.cache.get(user.id);
  //   if (!guildMember) {
  //     return;
  //   }
  //   context.initiator = guildMember;
  //   this.payoutReaction(context);
  // });
  // client.on("messageReactionRemove", (messageReaction, user) => {
  //   const message = messageReaction.message;
  //   if (!user || !(message.channel instanceof TextChannel) || !message.guild) {
  //     return;
  //   }
  //   // Only subtract money for removing the user's only remaining reaction
  //   if (message.reactions.cache.filter((r) => !!r.users.cache.get(user.id)).size > 0) {
  //     return;
  //   }
  //   const context = new ExecutionContext(this.db, client, message.guild)
  //     .setMessage(messageReaction.message)
  //     .setChannelHelper(new ChannelHelper(message.channel, -1));
  //   const guildMember = context.guild.members.cache.get(user.id);
  //   if (!guildMember) {
  //     return;
  //   }
  //   context.initiator = guildMember;
  //   this.payoutReaction(context, true);
  // });
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
