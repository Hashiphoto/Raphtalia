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
  arrive,
  unarrive,
  postServerStatus,
};
