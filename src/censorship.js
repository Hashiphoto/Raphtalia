// Node libraries
import Discord from "discord.js";
import diacritic from "diacritic-regex";

// Files
import discordConfig from "../config/discord.config.js";
import db from "./db.js";
import {
  verifyPermission,
  hasRole,
  hasRoleOrHigher,
} from "./util/roleManagement.js";
import { addInfractions } from "./util/infractionManagement.js";

async function rebuildCensorshipList(guildId) {
  let bannedWords = await db.bannedWords.getAll(guildId);
  let regexString = "(^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(";
  for (let i = 0; i < bannedWords.length; i++) {
    // Last word
    if (i === bannedWords.length - 1) {
      regexString += diacritic.toString()(bannedWords[i].word);
    } else {
      regexString += diacritic.toString()(bannedWords[i].word) + "|";
    }
  }
  regexString += ")(?![a-zA-Z0-9À-ÖØ-öø-ÿ])";

  return db.guilds.updateCensorshipRegex(guildId, regexString);
}

/**
 * Check a message for banned words and censor it appropriately
 *
 * @param {Discord.Message} message - The message to check for censorship
 * @returns {Boolean} - True if the message was censored
 */
function censorMessage(message) {
  return db.guilds.get(message.guild.id).then((guild) => {
    if (!guild.censorship_enabled) {
      return false;
    }

    const sender = message.guild.members.get(message.author.id);

    // The supreme dictator is not censored. Also, immigrants are handled by the Arrive command
    if (
      hasRole(sender, discordConfig().roles.leader) ||
      hasRole(sender, discordConfig().roles.immigrant)
    ) {
      return false;
    }

    let bannedRegex = new RegExp(guild.censor_regex, "gi");
    if (message.content.match(bannedRegex) == null) {
      return false;
    }

    message.delete();
    if (message.channel) {
      message.channel.watchSend({
        embed: {
          title: "Censorship Report",
          description: `What ${
            sender.displayName
          } ***meant*** to say is \n> ${message.content.replace(
            bannedRegex,
            "██████"
          )}`,
          color: 13057084,
          timestamp: new Date(),
        },
      });
    }

    addInfractions(
      sender,
      message.channel,
      1,
      `This infraction has been recorded`
    );
    return true;
  });
}

function containsBannedWords(guildId, text) {
  return db.guilds.get(guildId).then((guild) => {
    if (!guild.censorship_enabled) {
      return false;
    }

    return text.match(guild.censor_regex) != null;
  });
}

function banWords(message, permissionLevel) {
  return db.guilds.get(message.guild.id).then((guild) => {
    if (!guild.censorship_enabled) {
      if (channel)
        return message.channel.watchSend("Censorship is currently disabled");
      return;
    }

    let words = message.args;
    if (words.length === 0) {
      printBanList(message.channel);
      return;
    }

    if (verifyPermission(message.sender, message.channel, permissionLevel)) {
      return;
    }

    // Construct an array of rows to insert into the db
    let values = [];
    words.forEach((word) => {
      values.push([word, message.guild.id]);
    });
    db.bannedWords.insert(values).then(() => {
      rebuildCensorshipList(message.guild.id);
    });
    if (message.channel)
      return message.channel.watchSend(
        `You won't see these words again: ${words}`
      );
  });
}

function allowWords(message, permissionLevel) {
  return db.guilds.get(message.guild.id).then((guild) => {
    if (!guild.censorship_enabled) {
      if (channel) return channel.watchSend("Censorship is currently disabled");
      return;
    }

    let words = message.args;
    if (words.length === 0) {
      printBanList(message.channel);
      return;
    }

    if (verifyPermission(message.sender, message.channel, permissionLevel)) {
      return;
    }

    db.bannedWords.delete(message.guild.id, words).then(() => {
      rebuildCensorshipList(message.guild.id);
    });
    if (message.channel)
      return message.channel.watchSend(
        `These words are allowed again: ${words}`
      );
  });
}

function printBanList(channel) {
  if (!channel) return;
  db.bannedWords.getAll(channel.guild.id).then((rows) => {
    let banList = "";
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].word.includes(" ")) {
        banList += `'${rows[i].word}'`;
      } else {
        banList += `${rows[i].word}`;
      }
      if (i !== rows.length - 1) {
        banList += ", ";
      }
    }
    if (channel)
      return channel.watchSend(`Here are all the banned words: ${banList}`);
  });
}

function enable(message, isCensoring, allowedRole) {
  if (!hasRoleOrHigher(message.sender, allowedRole)) {
    return permissionInfract(channel);
  }
  db.guilds.setCensorship(message.guild.id, isCensoring).then(() => {
    if (isCensoring) {
      return printBanList(message.channel);
    } else {
      if (message.channel)
        return message.channel.watchSend("All speech is permitted!");
    }
  });
}

export default {
  censorMessage,
  banWords,
  allowWords,
  containsBannedWords,
  enable,
};
