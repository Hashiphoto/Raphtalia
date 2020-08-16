import Discord from "discord.js";

import db from "../db/Database.js";
import discordConfig from "../../config/discord.config.js";
import { hasRole, demoteMember } from "./roleManagement.js";
import { softkickMember } from "./guildManagement.js";

const infractionLimit = 3;

/**
 * Increases the infraction count for a given member. If they exceed the infractionLimit, the member
 * is exiled
 *
 * @param {Discord.GuildMember} member - The member to infract
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Number} [amount] - The amount of infractions to increase by (default is 1)
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
export function addInfractions(member, channel, amount = 1, reason = "") {
  db.users
    .incrementInfractions(member.id, member.guild.id, amount)
    .then(() => {
      return reportInfractions(member, channel, reason + "\n");
    })
    .then((count) => {
      checkInfractionCount(channel, member, count);
    });
}

/**
 * Set the absolute infraction count for a given member
 *
 * @param {Discord.GuildMember} member - The member to set the infractions for
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {number} amount - The number of infractions they will have
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
export function setInfractions(member, channel, amount = 1, reason = "") {
  db.users
    .setInfractions(member.id, member.guild.id, amount)
    .then(() => {
      return reportInfractions(member, channel, reason + "\n");
    })
    .then((count) => {
      checkInfractionCount(channel, member, count);
    });
}

/**
 * Print out the number of infractions a member has incurred in the given channel
 *
 * @param {Discord.GuildMember} member - The member whose fractions are reported
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} pretext - Text to prepend at the beginning of the infraction message
 */
export function reportInfractions(member, channel, pretext = "") {
  const discordName = member.toString();
  return db.users.get(member.id, member.guild.id).then((user) => {
    let reply;
    if (user.infractions === 0) {
      reply = `${discordName} has no recorded infractions`;
    } else {
      reply = `${pretext}${discordName} has incurred ${user.infractions} infractions`;
    }
    if (channel) channel.watchSend(reply);

    return user.infractions;
  });
}

/**
 * Check if infractions is over the limit, then exile the member if so.
 * If they are already in exile, then softkick them.
 *
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} member - The GuildMember to check infractions for
 * @param {number} count - The number of infractions accrued
 */
export async function checkInfractionCount(channel, member, count = null) {
  if (count == null) {
    let user = await db.users.get(member.id, member.guild.id);
    count = user.infractions;
  }
  if (count >= infractionLimit) {
    if (hasRole(member, discordConfig().roles.exile)) {
      softkickMember(
        channel,
        member,
        `Doing something illegal while under exile? Come on back when you're feeling more agreeable.`
      );
    } else {
      demoteMember(channel, null, member);
    }
  }
}
