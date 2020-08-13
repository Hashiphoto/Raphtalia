import Discord from "discord.js";

import db from "../db/db.js";

export function payoutMessage(message, dbGuild) {
  var amount = calculatePayout(message, dbGuild);

  if (!amount) {
    return;
  }

  let sender = message.guild.members.get(message.author.id);

  return addCurrency(sender, amount);
}

export function calculatePayout(message, dbGuild) {
  if (message.content.length < dbGuild.min_length) {
    return 0;
  }

  return Math.min(
    dbGuild.base_payout + message.content.length * dbGuild.character_value,
    dbGuild.max_payout
  );
}

/**
 * Increases the infraction count for a given member. If they exceed the infractionLimit, the member
 * is exiled
 *
 * @param {Discord.GuildMember} member - The member to infract
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Number} [amount] - The amount of infractions to increase by (default is 1)
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
export function addCurrency(member, amount = 1) {
  return db.users.incrementCurrency(member.id, member.guild.id, amount);
}

export function getUserIncome(member) {
  return db.users.get(member.id, member.guild.id).then((dbUser) => {
    // Check for personally-set income
    let bonusIncome = 0;
    if (dbUser.bonus_income != 0) {
      bonusIncome = dbUser.bonus_income;
    }
    // Check for role income
    if (!member.hoistRole) {
      return bonusIncome;
    }
    return db.roles.getSingle(member.hoistRole.id).then((dbRole) => {
      if (!dbRole) {
        return bonusIncome;
      }

      return dbRole.income;
    });
  });
}

/**
 * Print out the number of infractions a member has incurred in the given channel
 *
 * @param {Discord.GuildMember} member - The member whose fractions are reported
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} pretext - Text to prepend at the beginning of the infraction message
 */
export function reportCurrency(member, channel) {
  return db.users.get(member.id, member.guild.id).then((user) => {
    if (!channel) {
      return user.currency;
    }
    let reply;
    if (user.currency === 0) {
      reply = `You are broke!`;
    } else if (user.currency < 0) {
      reply = `You are $${user.currency.toFixed(2)} in debt`;
    } else {
      reply = `You have $${user.currency.toFixed(2)}`;
    }
    if (channel.type === "dm") {
      reply += ` in ${member.guild.name}`;
    }
    channel.send(reply);

    return user.currency;
  });
}
