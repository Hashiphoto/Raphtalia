import Discord from "discord.js";
import dayjs from "dayjs";

import links from "../resources/links.js";
import db from "./db/db.js";
import youtube from "./youtube.js";
import censorship from "./censorship.js";
import discordConfig from "../config/discord.config.js";
import sendTimedMessage from "./util/timedMessage.js";
import { percentFormat, extractNumber } from "./util/format.js";
import { clearChannel } from "./util/guildManagement.js";
import { dateFormat, parseTime } from "./util/format.js";
import arrive from "./arrive.js";
import { softkickMember } from "./util/guildManagement.js";
import {
  updateServerStatus,
  generateServerStatus,
} from "./util/serverStatus.js";
import {
  addInfractions,
  reportInfractions,
} from "./util/infractionManagement.js";
import {
  addCurrency,
  getUserIncome,
  reportCurrency,
} from "./util/currencyManagement.js";
import {
  getNextRole,
  verifyPermission,
  pardonMember,
  exileMember,
  addRoles,
  convertToRole,
  promoteMember,
  demoteMember,
} from "./util/roleManagement.js";

/**
 * Send all the message.mentionedMembers an invite and kick them
 */
function softkick(message, allowedRole, reason = "") {
  if (
    message.sender != null &&
    !verifyPermission(message.sender, message.channel, allowedRole)
  ) {
    return;
  }

  if (message.mentionedMembers.length === 0) {
    if (message.channel)
      message.channel.watchSend(
        "Please repeat the command and specify who is being gently kicked"
      );
    return;
  }

  message.mentionedMembers.forEach((target) => {
    softkickMember(message.channel, target, reason);
  });
}

/**
 * Remove all roles from message.mentionedMembers who have the exile role
 */
function pardon(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  if (message.mentionedMembers.length === 0) {
    if (message.channel)
      message.channel.watchSend(
        "Please repeat the command and specify who is being pardoned"
      );
    return;
  }

  message.mentionedMembers.forEach((target) => {
    pardonMember(target, message.channel);
  });
}

/**
 * Remove all hoisted roles from each target and increases their former highest role by one
 */
function promote(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  if (message.mentionedMembers.length === 0) {
    if (message.channel) return;
  }

  message.mentionedMembers.forEach((target) => {
    promoteMember(message.channel, message.sender, target);
  });
}

/**
 * TESTING ONLY - Removes the papers db entry for the target. If no target is given,
 * it deletes the sender's db entry
 */
function unarrive(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  let target = message.sender;
  if (message.mentionedMembers.length > 0) {
    target = message.mentionedMembers[0];
  }
  return db.users
    .setCitizenship(target.id, member.guild.id, false)
    .then(() => {
      return target.roles.forEach((role) => {
        target.removeRole(role);
      });
    })
    .then(() => {
      if (message.channel)
        return message.channel.watchSend(
          `${target}'s papers have been deleted from record`
        );
    });
}

/**
 * Play the Soviet Anthem in a voice channel
 */
function play(message, allowedRole) {
  let voiceChannel = null;
  let volume = 0.5;
  // Remove the command
  let content = message.content.replace(/!\w+/, "");

  // Check if volume was specified
  let volRegex = /\b\d+(\.\d*)?v/;
  let volMatches = content.match(volRegex);
  if (volMatches != null) {
    volume = parseFloat(volMatches[0]);
    // Remove the volume from the string
    content = content.replace(volRegex, "");
  }

  // Check if channel was specified
  let firstMatch = null;
  let secondMatch = null;
  let matches = content.match(/\bin [-\w ]+/); // Everything from the "in " until the first slash (/)
  if (matches != null) {
    // Parameters are restricted permission
    if (!verifyPermission(message.sender, message.channel, allowedRole)) {
      return;
    }

    firstMatch = matches[0].slice(3).trim(); // remove the "in "
    matches = content.match(/\/[\w ]+/); // Everything after the first slash (/), if it exists

    // The first match is the category and the second match is the channel name
    if (matches != null) {
      // remove the "in "
      secondMatch = matches[0].slice(1).trim();
      voiceChannel = message.guild.channels.find(
        (channel) =>
          channel.type == "voice" &&
          channel.name.toLowerCase() === secondMatch.toLowerCase() &&
          channel.parent &&
          channel.parent.name.toLowerCase() === firstMatch.toLowerCase()
      );
      if (voiceChannel == null) {
        if (message.channel)
          message.channel.watchSend(
            "I couldn't find a voice channel by that name"
          );
        return;
      }
    }

    // If there is second parameter, then firstMatch is the voice channel name
    else {
      voiceChannel = message.guild.channels.find(
        (channel) =>
          channel.type == "voice" &&
          channel.name.toLowerCase() === firstMatch.toLowerCase()
      );
      if (voiceChannel == null) {
        if (message.channel)
          message.channel.watchSend(
            "I couldn't find a voice channel by that name"
          );
        return;
      }
    }
  }

  // If no voice channel was specified, play the song in the vc the sender is in
  if (voiceChannel == null) {
    voiceChannel = message.sender.voiceChannel;

    if (!voiceChannel) {
      if (message.channel)
        return message.channel.watchSend(
          "Join a voice channel first, comrade!"
        );
      return;
    }
  }
  const permissions = voiceChannel.permissionsFor(message.sender.client.user);
  if (
    !permissions.has("VIEW_CHANNEL") ||
    !permissions.has("CONNECT") ||
    !permissions.has("SPEAK")
  ) {
    return message.channel.watchSend(
      "I don't have permission to join that channel"
    );
  }
  return youtube.play(voiceChannel, links.youtube.anthem, volume);
}

/**
 * Sends the timed message, but also kicks them if they answer incorrectly or include a censored word
 */
async function askGateQuestion(channel, member, question) {
  try {
    // For strict questions, always take the first answer
    let questionCopy = JSON.parse(JSON.stringify(question));
    if (question.strict) {
      questionCopy.answer = ".*";
    }

    // Wait until they supply an answer matching the question.answer regex
    let response = await sendTimedMessage(channel, member, questionCopy);

    if (await censorship.containsBannedWords(member.guild.id, response)) {
      softkickMember(channel, member, "We don't allow those words here");
      return false;
    }

    // For strict questions, kick them if they answer wrong
    if (question.strict) {
      let answerRe = new RegExp(question.answer, "gi");
      if (response.match(answerRe) == null) {
        throw new Error("Incorrect response given");
      }
    }

    return true;
  } catch (e) {
    softkickMember(
      channel,
      member,
      "Come join the Gulag when you're feeling more agreeable."
    );
    return false;
  }
}

function registerVoter(message) {
  addRoles(message.sender, [discordConfig().roles.voter])
    .then(() => {
      if (message.channel)
        message.channel.watchSend(`You are now a registered voter!`);
    })
    .catch(() => {
      if (message.channel)
        message.channel.watchSend(`You are already registered, dingus`);
    });
}

/**
 *
 */
async function setRolePrice(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  if (!message.args || message.args.length === 0) {
    return message.channel.watchSend(`Usage: !RolePrice 1`);
  }
  let multiplier = extractNumber(message.args[0]).number;
  if (multiplier == null) {
    return message.channel.watchSend(`Usage: !RolePrice 1`);
  }

  let announcement = `Every role's purchase price is now ${multiplier.toFixed(
    2
  )}x its daily income!\n`;
  let neutralRole = convertToRole(message.guild, discordConfig().roles.neutral);
  if (!neutralRole) {
    return message.channel.watchSend("There is no neutral role");
  }
  let discordRoles = message.guild.roles
    .filter(
      (role) =>
        role.hoist && role.calculatedPosition >= neutralRole.calculatedPosition
    )
    .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
    .array();

  for (let i = 0; i < discordRoles.length; i++) {
    let dbRole = await db.roles.getSingle(discordRoles[i].id);
    let newPrice = dbRole.income * multiplier;
    db.roles.setRolePrice(discordRoles[i].id, newPrice);
    announcement += `${discordRoles[i].name} new price: $${newPrice.toFixed(
      2
    )}\n`;
  }
  message.channel
    .watchSend(announcement)
    .then(updateServerStatus(message.channel));
}

async function postServerStatus(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }
  const statusEmbed = await generateServerStatus(message.guild);

  db.guilds
    .get(message.guild.id)
    .then(async (guild) => {
      // Delete the existing status message, if it exists
      if (!guild || !guild.status_message_id) {
        return;
      }
      let textChannels = message.guild.channels
        .filter((channel) => channel.type === "text" && !channel.deleted)
        .array();
      for (let i = 0; i < textChannels.length; i++) {
        try {
          let message = await textChannels[i].fetchMessage(
            guild.status_message_id
          );
          message.delete();
          return;
        } catch (e) {}
      }
    })
    .then(() => {
      // Post the new status message
      return message.channel.send({ embed: statusEmbed });
    })
    .then((message) => {
      // Update the status message in the db
      message.pin();
      return db.guilds.setStatusMessage(message.guild.id, message.id);
    });
}

export default {
  softkick,
  pardon,
  promote,
  arrive,
  unarrive,
  play,
  registerVoter,
  setRolePrice,
  postServerStatus,
};
