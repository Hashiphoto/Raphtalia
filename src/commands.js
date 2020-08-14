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
 * Reports the number of infractions for a list of guildMembers. Pass in an empty array
 * for message.mentionedMembers or leave it as null to report the sender's infractions instead
 */
function getInfractions(message) {
  if (
    message.mentionedMembers == null ||
    message.mentionedMembers.length === 0
  ) {
    return reportInfractions(message.sender, message.channel);
  } else {
    return reportInfractions(message.mentionedMembers[0], message.channel);
  }
}

/**
 * Remove all hoisted roles from the message.mentionedMembers and give the exile role
 */
function exile(message, allowedRole, releaseDate) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  if (message.mentionedMembers.length === 0) {
    if (message.channel)
      message.channel.watchSend(
        "Please repeat the command and specify who is being exiled"
      );
    return;
  }

  message.mentionedMembers.forEach((target) => {
    exileMember(target, message.channel, releaseDate);
  });
}

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

function holdVote(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  // Remove the command
  let content = message.content.replace(/^!\w+\s+/, "");

  // Replace the mentions with their nicknames and tags
  for (let i = 0; i < message.mentionedMembers.length; i++) {
    let re = new RegExp(`<@!?${message.mentionedMembers[i].id}>`);
    let plainText = message.mentionedMembers[i].user.tag;
    if (message.mentionedMembers[i].nickname) {
      plainText += ` (${message.mentionedMembers[i].nickname})`;
    }
    content = content.replace(re, plainText);
  }

  // Get the duration and remove it from the command. It must come at the end
  let timeMatches = content.match(/(\s*\d+[dhms]){1,4}\s*$/gi);
  let endDate;
  if (timeMatches == null) {
    endDate = parseTime("1h");
  } else {
    let timeText = timeMatches[0];
    content = content.slice(0, -timeText.length).trim();
    endDate = parseTime(timeText);
  }
  let duration = endDate.diff(dayjs());
  if (duration > 0x7fffffff) {
    duration = 0x7fffffff;
  }

  // Get the options
  let options = content.split(",");
  let voteTally = [];
  let textOptions = "";
  let answersRegEx = "^(";
  for (let i = 0; i < options.length; i++) {
    options[i] = options[i].trim();
    if (options[i].length === 0) {
      continue;
    }
    let votingNum = i + 1;
    textOptions += `${votingNum} - ${options[i]}\n`;
    voteTally.push({
      id: votingNum,
      name: options[i],
      votes: 0,
      percentage: "",
    });
    if (i === options.length - 1) {
      answersRegEx += votingNum;
    } else {
      answersRegEx += votingNum + "|";
    }
  }
  answersRegEx += ")$";
  if (voteTally.length === 0) {
    if (message.channel)
      message.channel.watchSend(
        "Please try again and specify the options of the vote\nEx: `!HoldVote option a, option b  3h 30m`"
      );
    return;
  }

  // Send out the voting messages
  if (message.channel)
    message.channel.watchSend(
      `Voting begins now and ends at ${endDate.format(dateFormat)}`
    );

  let announcement = {
    prompt:
      `**A vote is being held in ${message.guild.name}!**\n` +
      `Please vote for one of the options below by replying with the number of the choice.\n` +
      `Voting ends at ${endDate.format(dateFormat)}\n\n${textOptions}`,
    answer: answersRegEx,
    timeout: duration,
    strict: false,
  };

  let voters = convertToRole(message.guild, discordConfig().roles.voter)
    .members;
  if (voters.size === 0) {
    if (message.channel)
      message.channel.watchSend(`There are no registered voters :monkaS:`);
    return;
  }

  voters.forEach((voter) => {
    let dmChannel;
    voter
      .createDM()
      .then((channel) => {
        dmChannel = channel;
        return sendTimedMessage(dmChannel, voter, announcement, false);
      })
      .then((choice) => {
        let msg = `Thank you for your vote!`;
        if (dmChannel)
          msg += `\nResults will be announced in **${message.guild.name}/#${message.channel.name}** when voting is closed`;
        dmChannel.send(msg);
        console.log(`${voter.displayName} chose ${choice}`);
        voteTally.find((v) => v.id === parseInt(choice)).votes++;
      })
      .catch((error) => {
        console.error(error);
        console.log(`${voter.displayName} did not vote`);
        dmChannel.send(`Voting has closed.`);
      });
  });

  // Announce results
  setTimeout(function () {
    let totalVotes = 0;

    // Get results
    voteTally.sort(function (a, b) {
      return b.votes - a.votes;
    });
    voteTally.forEach((option) => {
      totalVotes += option.votes;
    });
    voteTally.forEach((option) => {
      option.percentage = `${percentFormat(option.votes / totalVotes)}%`;
    });

    // Format results into table
    let longestName = 0,
      longestPercent = 0;
    voteTally.forEach((option) => {
      if (option.name.length > longestName) {
        longestName = option.name.length;
      }
      if (option.percentage.length > longestPercent) {
        longestPercent = option.percentage.length;
      }
    });
    let fill = " ";
    let resultsMsg = "```";
    voteTally.forEach((option) => {
      let nameFormatted =
        option.name + fill.repeat(longestName - option.name.length);
      let percentFormatted =
        fill.repeat(longestPercent - option.percentage.length) +
        option.percentage;
      resultsMsg += `${nameFormatted} | ${percentFormatted} | ${option.votes} votes\n`;
    });
    resultsMsg += "```";

    // Check for ties and announce final results
    let ties = [];
    let finalResults = "";
    ties.push(voteTally[0]);
    for (let i = 1; i < voteTally.length; i++) {
      if (voteTally[i].votes == ties[0].votes) {
        ties.push(voteTally[i]);
      }
    }
    if (ties.length > 1) {
      let tieList = "";
      for (let i = 0; i < ties.length; i++) {
        tieList += ties[i].name.toUpperCase();
        if (i === ties.length - 2) {
          tieList += ", and ";
        } else if (i < ties.length - 1) {
          tieList += ", ";
        }
      }
      finalResults =
        `Voting is done!\n**There is a ${ties.length}-way tie between ${tieList}** ` +
        `with ${percentFormat(
          ties[0].votes / totalVotes
        )}% of the vote each\n${resultsMsg}`;
    } else {
      finalResults =
        `Voting is done!\n**The winner is ${voteTally[0].name.toUpperCase()}** ` +
        `with ${percentFormat(
          voteTally[0].votes / totalVotes
        )}% of the vote\n${resultsMsg}`;
    }
    if (message.channel) message.channel.watchSend(finalResults);
  }, duration);
}

function giveCurrency(message) {
  if (!message.args || message.args.length === 0) {
    if (message.channel)
      message.channel.watchSend(
        "Please try again and specify the amount of money"
      );
    return;
  }

  let amount = 1;
  message.args.forEach((arg) => {
    let temp = extractNumber(arg).number;
    if (temp) {
      amount = temp;
      return;
    }
  });
  if (amount < 0) {
    return addInfractions(
      message.sender,
      message.channel,
      1,
      "What are you trying to pull?"
    );
  }
  let totalAmount = amount * message.mentionedMembers.length;
  db.users.get(message.sender.id, message.sender.guild.id).then((dbUser) => {
    if (dbUser.currency < totalAmount) {
      return message.channel.watchSend("You don't have enough money for that");
    }
    addCurrency(message.sender, -totalAmount);
    message.mentionedMembers.forEach((target) => {
      addCurrency(target, amount);
    });
    message.channel.watchSend("Money transferred!");
  });
}

function fine(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }
  if (!message.mentionedMembers || message.mentionedMembers.length === 0) {
    return message.channel.watchSend(
      "Please try again and specify who is being fined"
    );
  }

  let amount = 1;
  message.args.forEach((arg) => {
    let temp = extractNumber(arg).number;
    if (temp) {
      amount = temp;
      return;
    }
  });
  addCurrency(message.sender, amount * message.mentionedMembers.length);
  for (let i = 0; i < message.mentionedMembers.length; i++) {
    addCurrency(message.mentionedMembers[i], -amount);
  }
  let reply =
    `Fined $${amount.toFixed(2)}` +
    (message.mentionedMembers.length > 1 ? ` each!` : `!`);
  message.channel.watchSend(reply);
}

function setEconomy(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }
  if (!message.args || message.args.length <= 1) {
    return message.channel.watchSend(
      "Usage: `Economy [MinLength $1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`"
    );
  }

  for (let i = 0; i < message.args.length - 1; i += 2) {
    let amount = extractNumber(message.args[i + 1]).number;
    if (amount == null)
      return message.channel.watchSend("Could not understand arguments");

    switch (message.args[i].toLowerCase()) {
      case "minlength":
        db.guilds.setMinLength(message.guild.id, amount);
        message.channel.watchSend(
          `The minimum length for a message to be a paid is now ${amount.toFixed(
            0
          )} characters`
        );
        break;
      case "charvalue":
        db.guilds.setCharacterValue(message.guild.id, amount);
        message.channel.watchSend(
          `Messages over the minimum length earn $${amount.toFixed(
            2
          )} per character`
        );
        break;
      case "maxpayout":
        db.guilds.setMaxPayout(message.guild.id, amount);
        message.channel.watchSend(
          `The max value earned from a paid message is now $${amount.toFixed(
            2
          )}`
        );
        break;
      case "basepayout":
        db.guilds.setBasePayout(message.guild.id, amount);
        message.channel.watchSend(
          `Messages over the minimum length earn a base pay of $${amount.toFixed(
            2
          )}`
        );
        break;
      case "taxrate":
        db.guilds.setTaxRate(message.guild.id, amount / 100);
        message.channel.watchSend(
          `Members are taxed ${amount.toFixed(
            2
          )}% of their role income on a weekly basis`
        );
        break;
    }
  }
}

async function income(message, allowedRole) {
  if (!message.args || message.args.length === 0) {
    return getUserIncome(message.sender).then((income) => {
      return message.channel.watchSend(
        `Your daily income is $${income.toFixed(2)}`
      );
    });
  }
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }
  if (message.args.length < 2) {
    return message.channel.watchSend(
      "Usage: `!Income [base $1] [scale ($1|1%)]`"
    );
  }

  // Check for base income set
  for (let i = 0; i < message.args.length - 1; i++) {
    if (message.args[i] !== "base") {
      continue;
    }
    let amount = extractNumber(message.args[i + 1]);
    if (amount.number == null || amount.isPercent) {
      return message.channel.watchSend(
        "Please try again and specify the base pay in dollars. e.g. `!Income base $100`"
      );
    }
    await db.guilds.setBaseIncome(message.guild.id, amount.number);
  }

  let baseIncome = (await db.guilds.get(message.guild.id)).base_income;

  // Income scale
  for (let i = 0; i < message.args.length - 1; i++) {
    if (message.args[i] !== "scale") {
      continue;
    }

    let amount = extractNumber(message.args[i + 1]);
    if (amount.number == null || amount.isDollar === amount.isPercent) {
      return message.channel.watchSend(
        "Please try again and specify the scale as a percent or dollar amount. e.g. `!Income scale $100` or `!Income scale 125%"
      );
    }
    if (amount.isPercent && amount.number < 1) {
      return message.channel.watchSend("Income scale must be at least 100%");
    }
    let neutralRole = convertToRole(
      message.guild,
      discordConfig().roles.neutral
    );
    if (!neutralRole) {
      return message.channel.watchSend("There is no neutral role");
    }
    let roles = message.guild.roles
      .filter(
        (role) =>
          role.hoist &&
          role.calculatedPosition >= neutralRole.calculatedPosition
      )
      .sort((a, b) => a.calculatedPosition - b.calculatedPosition)
      .array();

    return message.channel
      .watchSend(await setIncomeScale(baseIncome, roles, amount))
      .then(updateServerStatus(message.channel));
  }
}

async function setIncomeScale(baseIncome, roles, amount) {
  let nextIncome = baseIncome;
  let announcement = "";
  for (let i = 0; i < roles.length; i++) {
    await db.roles.setRoleIncome(roles[i].id, nextIncome);
    announcement += `${roles[i].name} will now earn $${nextIncome.toFixed(
      2
    )}\n`;
    if (amount.isDollar) {
      nextIncome += amount.number;
    } else {
      nextIncome = nextIncome * amount.number;
    }
  }
  return announcement;
}

async function buy(message) {}

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
  getInfractions,
  exile,
  softkick,
  pardon,
  promote,
  arrive,
  unarrive,
  play,
  registerVoter,
  holdVote,
  giveCurrency,
  fine,
  setEconomy,
  income,
  setRolePrice,
  postServerStatus,
};
