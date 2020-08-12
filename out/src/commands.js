"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
// Files
const links_json_1 = __importDefault(require("../resources/links.json"));
const helper_js_1 = __importDefault(require("./helper.js"));
const db_js_1 = __importDefault(require("./db.js"));
const welcome_questions_json_1 = __importDefault(require("../resources/welcome-questions.json"));
const youtube_js_1 = __importDefault(require("./youtube.js"));
const censorship_js_1 = __importDefault(require("./censorship.js"));
const discordConfig = require("../config/discord.json")[process.env.NODE_ENV || "dev"];
/**
 * Very unhelpful at the moment
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 */
function help(message, channel, guild) {
    channel.send(`Help yourself, ${message.sender}`);
}
/**
 * Reports the number of infractions for a list of guildMembers. Pass in an empty array
 * for targets or leave it as null to report the sender's infractions instead
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - Whoever issued the command
 * @param {Discord.GuildMember[]} targets An array of guildMember objects to get the infractions for
 */
function getInfractions(message, channel, guild) {
    if (!message.memberMentions || message.memberMentions.length === 0) {
        helper_js_1.default.reportInfractions(message.sender, channel);
    }
    else {
        helper_js_1.default.reportInfractions(message.memberMentions[0], channel);
    }
}
/**
 * Kick members and send them off with a nice wave and gif
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to kick
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function kick(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who is getting the boot");
        return;
    }
    message.memberMentions.forEach((target) => {
        target
            .kick()
            .then((member) => {
            let randInt = Math.floor(Math.random() * links_json_1.default.gifs.kicks.length);
            let kickGif = links_json_1.default.gifs.kicks[randInt];
            if (channel)
                channel.send(`:wave: ${member.displayName} has been kicked\n${kickGif}`);
        })
            .catch((e) => {
            if (channel)
                channel.send("Something went wrong...");
            console.error(e);
        });
    });
}
/**
 * Increase the infraction count for the list of targets
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to increase the infraction count for
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function report(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who is being reported");
        return;
    }
    let amount = 1;
    for (let i = 0; i < message.args.length; i++) {
        let relMatches = message.args[i].match(/^\+?\d+$/g);
        if (relMatches) {
            amount = parseInt(relMatches[0]);
            break;
        }
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.addInfractions(target, channel, amount, "Yes sir~!");
    });
}
/**
 * Remove all hoisted roles from the targets and give the exile role
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to exile
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 * @param {dayjs} releaseDate - The time when the exile will end
 */
function exile(message, channel, guild, allowedRole, releaseDate) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who is being exiled");
        return;
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.exile(target, channel, releaseDate);
    });
}
/**
 * Send all the targets an invite and kick them
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to softkick
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function softkick(message, channel, guild, allowedRole, reason = "") {
    if (message.sender != null &&
        !helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who is being gently kicked");
        return;
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.softkick(channel, target, reason);
    });
}
/**
 * Remove all roles from targets who have the exile role
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to pardon
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function pardon(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who is being pardoned");
        return;
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.pardon(target, channel);
    });
}
/**
 * Remove all hoisted roles from each target and increases their former highest role by one
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to promote
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function promote(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            return;
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.promote(channel, message.sender, target);
    });
}
/**
 * Remove all hoisted roles from each target and decreases their former highest role by one
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to demote
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function demote(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who is being demoted");
        return;
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.demote(channel, message.sender, target);
    });
}
/**
 * Send some love to the targets
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to headpat
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function comfort(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (!channel)
        return;
    if (message.memberMentions.length === 0) {
        channel.send("Please repeat the command and specify who I'm headpatting");
        return;
    }
    message.memberMentions.forEach((member) => {
        channel.send(member.toString() + " headpat");
    });
}
/**
 * Send a message and wait for the first matching response. If no responses are recieved within the timeout,
 * a 'time' exception is thrown
 *
 * @param {Discord.TextChannel} channel - The channel to send the message and listen for responses
 * @param {Discord.GuildMember} member - The only guildMember to listen for responses
 * @param {Object} question - The question and answer object
 * @param {String} question.prompt - The question to ask
 * @param {String} question.answer - The accepted answer that will be accepted on a RegEx match (case insensitive)
 * @param {number} question.timeout - The timeout in milliseconds before a 'time' exception is thrown
 * @returns {Promise<Discord.Collection<String, Discord.Message>>} On fulfilled, returns a collection of messages received
 */
function sendTimedMessage(channel, member, question, showDuration = true) {
    if (!channel)
        return;
    const filter = function (message) {
        var re = new RegExp(question.answer, "gi");
        return message.content.match(re) != null && message.author.id === member.id;
    };
    let text = "";
    if (showDuration) {
        text += `\`(${question.timeout / 1000}s)\`\n`;
    }
    text += question.prompt;
    return channel
        .send(text)
        .then(() => {
        // Get the first message that matches the filter. Errors out if the time limit is reached
        return channel.o.awaitMessages(filter, {
            maxMatches: 1,
            time: question.timeout,
            errors: ["time"],
        });
    })
        .then((collected) => {
        return collected.first().content;
    });
}
/**
 * Sends the timed message, but also kicks them if they answer incorrectly or include a censored word
 * @param {} question
 */
function askGateQuestion(channel, member, question) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // For strict questions, always take the first answer
            let questionCopy = JSON.parse(JSON.stringify(question));
            if (question.strict) {
                questionCopy.answer = ".*";
            }
            // Wait until they supply an answer matching the question.answer regex
            let response = yield sendTimedMessage(channel, member, questionCopy);
            if (yield censorship_js_1.default.containsBannedWords(member.guild.id, response)) {
                helper_js_1.default.softkick(channel, member, "We don't allow those words here");
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
        }
        catch (e) {
            helper_js_1.default.softkick(channel, member, "Come join the Gulag when you're feeling more agreeable.");
            return false;
        }
    });
}
/**
 * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry,
 * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
 * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge).
 * If they do, they are made a comrade. If they don't, they are softkicked
 *
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} member - The guildMember that is being onboarded
 */
function arrive(channel, member) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!channel)
            return;
        yield helper_js_1.default.setHoistedRole(member, discordConfig.roles.immigrant);
        let dbUser = yield db_js_1.default.users.get(member.id, member.guild.id);
        // Check if already a citizen
        if (dbUser.citizenship) {
            channel.send(`Welcome back ${member}!`);
            helper_js_1.default.setHoistedRole(member, discordConfig.roles.neutral);
            return;
        }
        channel.send(`Welcome ${member} to ${channel.guild.name}!\n` +
            `I just have a few questions for you first. If you answer correctly, you will be granted citizenship.`);
        // Set nickname
        try {
            let nickname = yield sendTimedMessage(channel, member, welcome_questions_json_1.default.nickname);
            if (yield censorship_js_1.default.containsBannedWords(channel.guild.id, nickname)) {
                helper_js_1.default.softkick(channel, member, "We don't allow those words around here");
                return;
            }
            channel.send(`${member.displayName} will be known as ${nickname}!`);
            member.setNickname(nickname).catch((e) => {
                console.error(e);
                channel.send(`Sorry. I don't have permissions to set your nickname...`);
            });
        }
        catch (e) {
            console.error(e);
            channel.send(`${member} doesn't want a nickname...`);
        }
        for (let i = 0; i < welcome_questions_json_1.default.gulagQuestions.length; i++) {
            let answeredCorrect = yield askGateQuestion(channel, member, welcome_questions_json_1.default.gulagQuestions[i]);
            if (!answeredCorrect) {
                return;
            }
        }
        // Creates the user in the DB if they didn't exist
        db_js_1.default.users.setCitizenship(member.id, member.guild.id, true);
        channel
            .watchSend(`Thank you! And welcome loyal citizen to ${channel.guild.name}! 🎉🎉🎉`)
            .then(() => {
            helper_js_1.default.setHoistedRole(member, discordConfig.roles.neutral);
        });
    });
}
/**
 * TESTING ONLY - Removes the papers db entry for the target. If no target is given,
 * it deletes the sender's db entry
 *
 * @param {Discord.TextChannel} channel
 * @param {Discord.GuildMember} sender
 * @param {Discord.GuildMember[]} targets
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function unarrive(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    let target = message.sender;
    if (message.memberMentions.length > 0) {
        target = message.memberMentions[0];
    }
    return db_js_1.default.users
        .setCitizenship(target.id, guild.o.id, false)
        .then(() => {
        return target.roles.forEach((role) => {
            target.removeRole(role);
        });
    })
        .then(() => {
        if (channel)
            return channel.send(`${target}'s papers have been deleted from record`);
    });
}
/**
 * Play the Soviet Anthem in a voice channel
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {String[]} content - The text to parse for args. Can contain a float for volume and the phrase "in [channel name]" to specify
 * in which voice channel to play, by name.
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command in another voice channel
 */
function play(message, channel, guild, allowedRole) {
    let voiceChannel = null;
    let volume = 0.5;
    let content = message.o.content;
    // Remove the command
    content = content.replace(/!\w+/, "");
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
        if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
            return;
        }
        firstMatch = matches[0].slice(3).trim(); // remove the "in "
        matches = content.match(/\/[\w ]+/); // Everything after the first slash (/), if it exists
        // The first match is the category and the second match is the channel name
        if (matches != null) {
            // remove the "in "
            secondMatch = matches[0].slice(1).trim();
            voiceChannel = guild.o.channels.find((channel) => channel.type == "voice" &&
                channel.name.toLowerCase() === secondMatch.toLowerCase() &&
                channel.parent &&
                channel.parent.name.toLowerCase() === firstMatch.toLowerCase());
            if (voiceChannel == null) {
                if (channel)
                    channel.send("I couldn't find a voice channel by that name");
                return;
            }
        }
        // If there is second parameter, then firstMatch is the voice channel name
        else {
            voiceChannel = guild.o.channels.find((channel) => channel.type == "voice" &&
                channel.name.toLowerCase() === firstMatch.toLowerCase());
            if (voiceChannel == null) {
                if (channel)
                    channel.send("I couldn't find a voice channel by that name");
                return;
            }
        }
    }
    // If no voice channel was specified, play the song in the vc the sender is in
    if (voiceChannel == null) {
        voiceChannel = message.sender.voiceChannel;
        if (!voiceChannel) {
            if (channel)
                return channel.send("Join a voice channel first, comrade!");
            return;
        }
    }
    const permissions = voiceChannel.permissionsFor(message.sender.client.user);
    if (!permissions.has("VIEW_CHANNEL") ||
        !permissions.has("CONNECT") ||
        !permissions.has("SPEAK")) {
        return channel.send("I don't have permission to join that channel");
    }
    return youtube_js_1.default.play(voiceChannel, links_json_1.default.youtube.anthem, volume);
}
function registerVoter(message, channel, guild) {
    helper_js_1.default
        .addRoles(message.sender, [discordConfig.roles.voter])
        .then(() => {
        if (channel)
            channel.send(`You are now a registered voter!`);
    })
        .catch(() => {
        if (channel)
            channel.send(`You are already registered, dingus`);
    });
}
function holdVote(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    // Remove the command
    let content = message.o.content;
    content = content.replace(/^!\w+\s+/, "");
    // Replace the mentions with their nicknames and tags
    for (let i = 0; i < message.memberMentions.length; i++) {
        let re = new RegExp(`<@!?${message.memberMentions[i].id}>`);
        let plainText = message.memberMentions[i].user.tag;
        if (message.memberMentions[i].nickname) {
            plainText += ` (${message.memberMentions[i].nickname})`;
        }
        content = content.replace(re, plainText);
    }
    // Get the duration and remove it from the command. It must come at the end
    let timeMatches = content.match(/(\s*\d+[dhms]){1,4}\s*$/gi);
    let endDate;
    if (timeMatches == null) {
        endDate = helper_js_1.default.parseTime("1h");
    }
    else {
        let timeText = timeMatches[0];
        content = content.slice(0, -timeText.length).trim();
        endDate = helper_js_1.default.parseTime(timeText);
    }
    let duration = endDate.diff(dayjs_1.default());
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
        }
        else {
            answersRegEx += votingNum + "|";
        }
    }
    answersRegEx += ")$";
    if (voteTally.length === 0) {
        if (channel)
            channel.send("Please try again and specify the options of the vote\nEx: `!HoldVote option a, option b  3h 30m`");
        return;
    }
    // Send out the voting messages
    if (channel)
        channel.send(`Voting begins now and ends at ${endDate.format(helper_js_1.default.dateFormat)}`);
    let announcementText = {
        prompt: `**A vote is being held in ${guild.o.name}!**\n` +
            `Please vote for one of the options below by replying with the number of the choice.\n` +
            `Voting ends at ${endDate.format(helper_js_1.default.dateFormat)}\n\n${textOptions}`,
        answer: answersRegEx,
        timeout: duration,
        strict: false,
    };
    let voters = helper_js_1.default.convertToRole(guild.o, discordConfig.roles.voter).members;
    if (voters.size === 0) {
        if (channel)
            channel.send(`There are no registered voters :monkaS:`);
        return;
    }
    voters.forEach((voter) => {
        let dmChannel;
        voter
            .createDM()
            .then((channel) => {
            dmChannel = channel;
            return sendTimedMessage(dmChannel, voter, announcementText, false);
        })
            .then((choice) => {
            let msg = `Thank you for your vote!`;
            if (channel)
                msg += `\nResults will be announced in **${guild.o.name}/#${channel.o.name}** when voting is closed`;
            dmChannel.send(msg);
            console.log(`${voter.displayName} chose ${choice}`);
            voteTally.find((v) => v.id === parseInt(choice)).votes++;
        })
            .catch((error) => {
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
        let longestName = 0, longestPercent = 0;
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
            let nameFormatted = option.name + fill.repeat(longestName - option.name.length);
            let percentFormatted = fill.repeat(longestPercent - option.percentage.length) +
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
                }
                else if (i < ties.length - 1) {
                    tieList += ", ";
                }
            }
            finalResults =
                `Voting is done!\n**There is a ${ties.length}-way tie between ${tieList}** ` +
                    `with ${percentFormat(ties[0].votes / totalVotes)}% of the vote each\n${resultsMsg}`;
        }
        else {
            finalResults =
                `Voting is done!\n**The winner is ${voteTally[0].name.toUpperCase()}** ` +
                    `with ${percentFormat(voteTally[0].votes / totalVotes)}% of the vote\n${resultsMsg}`;
        }
        if (channel)
            channel.send(finalResults);
    }, duration);
}
function percentFormat(number) {
    if (isNaN(number)) {
        number = 0;
    }
    return (number * 100).toFixed(2);
}
function whisper(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0) {
        if (channel)
            channel.send("Please repeat the command and specify who I am whispering to");
        return;
    }
    // remove the command and targeet from the content
    let content = message.o.content;
    content = content.replace(/^\S+\s+<@!?(\d+)>\s+/, "");
    message.memberMentions[0].send(content);
}
/**
 * Reports the currency for a list of guildMembers. Pass in an empty array
 * for targets or leave it as null to report the sender's infractions instead
 *
 * @param {Discord.GuildMember} sender - Whoever issued the command
 * @param {Discord.GuildMember[]} targets An array of guildMember objects to get the infractions for
 */
function getCurrency(message, channel, guild) {
    message.sender.createDM().then((dmChannel) => {
        helper_js_1.default.reportCurrency(message.sender, dmChannel);
    });
}
function setAutoDelete(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (!message.args || message.args.length === 0) {
        if (channel)
            channel.send("Usage: `AutoDelete (start|stop) [delete delay ms]`");
        return;
    }
    let clearHistory = false;
    let enable = null;
    let deleteDelay = 2000;
    for (let i = 0; i < message.args.length; i++) {
        switch (message.args[i].toLowerCase()) {
            case "start":
                enable = true;
                break;
            case "stop":
                enable = false;
                break;
            case "clear":
                clearHistory = true;
            default:
                let num = parseInt(message.args[i]);
                if (isNaN(num)) {
                    continue;
                }
                deleteDelay = num;
        }
    }
    if (enable === null) {
        if (channel)
            channel.send("Usage: `AutoDelete (start|stop) [delete delay ms]`");
        return;
    }
    if (!enable) {
        deleteDelay = -1;
    }
    db_js_1.default.channels.setAutoDelete(channel.o.id, deleteDelay).then(() => {
        if (enable) {
            // clear all msgs
            if (clearHistory) {
                clearChannel(channel);
            }
            if (channel) {
                channel.send(`Messages are deleted after ${deleteDelay}ms`);
            }
        }
        else {
            if (channel) {
                channel.send("Messages are no longer deleted");
            }
        }
    });
}
function clearChannel(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        let pinnedMessages = yield channel.fetchPinnedMessages();
        let fetched;
        do {
            fetched = yield channel.fetchMessages({ limit: 100 });
            yield channel.bulkDelete(fetched.filter((message) => !message.pinned));
        } while (fetched.size > pinnedMessages.size);
    });
}
function giveCurrency(message, channel, guild) {
    if (!message.args || message.args.length === 0) {
        if (channel)
            channel.send("Please try again and specify the amount of money");
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
        return helper_js_1.default.addInfractions(message.sender, channel, 1, "What are you trying to pull?");
    }
    let totalAmount = amount * message.memberMentions.length;
    db_js_1.default.users.get(message.sender.id, guild.o.id).then((dbUser) => {
        if (dbUser.currency < totalAmount) {
            return channel.send("You don't have enough money for that");
        }
        helper_js_1.default.addCurrency(message.sender, -totalAmount);
        message.memberMentions.forEach((target) => {
            helper_js_1.default.addCurrency(target, amount);
        });
        channel.send("Money transferred!");
    });
}
function fine(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (!message.memberMentions || message.memberMentions.length === 0) {
        return channel.send("Please try again and specify who is being fined");
    }
    let amount = 1;
    message.args.forEach((arg) => {
        let temp = extractNumber(arg).number;
        if (temp) {
            amount = temp;
            return;
        }
    });
    helper_js_1.default.addCurrency(message.sender, amount * message.memberMentions.length);
    for (let i = 0; i < message.memberMentions.length; i++) {
        helper_js_1.default.addCurrency(message.memberMentions[i], -amount);
    }
    let responseText = `Fined $${amount.toFixed(2)}` +
        (message.memberMentions.length > 1 ? ` each!` : `!`);
    channel.send(responseText);
}
/**
 * Extract a decimal number from a string. Can be dollar format or percentage with a leading +/- sign
 *
 * @param {String} text - The number in string form to extract the number from
 * @returns {Object} - An Object with the following properties: "number" {Number}, "isDollar" {Boolean}, "isPercent" {Boolean}
 */
function extractNumber(text) {
    let amount = null;
    let isDollar = false;
    let isPercent = false;
    let matches = text.match(/^(\+|-)?(\$)?(\d*\.?\d+)(%|X)?$/i);
    /**
     * Index    Contains            Example
     * 0        The whole match     +$400.00%
     * 1        Plus or Minus       +
     * 2        Dollar Sign         $
     * 3        Number              400.00
     * 4        Percent Sign        %
     */
    if (matches) {
        amount = parseFloat(matches[3]);
        if (matches[1] === "-") {
            amount *= -1;
        }
        if (matches[4] === "%") {
            isPercent = true;
            amount /= 100;
        }
        isDollar = matches[2] === "$";
        amount = Math.floor(amount * 100) / 100;
    }
    return {
        number: amount,
        isDollar: isDollar,
        isPercent: isPercent,
    };
}
function setEconomy(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (!message.args || message.args.length <= 1) {
        return channel.send("Usage: `Economy [MinLength $1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`");
    }
    for (let i = 0; i < message.args.length - 1; i += 2) {
        let amount = extractNumber(message.args[i + 1]).number;
        if (amount == null)
            return channel.send("Could not understand arguments");
        switch (message.args[i].toLowerCase()) {
            case "minlength":
                db_js_1.default.guilds.setMinLength(guild.o.id, amount);
                channel.send(`The minimum length for a message to be a paid is now ${amount.toFixed(0)} characters`);
                break;
            case "charvalue":
                db_js_1.default.guilds.setCharacterValue(guild.o.id, amount);
                channel.send(`Messages over the minimum length earn $${amount.toFixed(2)} per character`);
                break;
            case "maxpayout":
                db_js_1.default.guilds.setMaxPayout(guild.o.id, amount);
                channel.send(`The max value earned from a paid message is now $${amount.toFixed(2)}`);
                break;
            case "basepayout":
                db_js_1.default.guilds.setBasePayout(guild.o.id, amount);
                channel.send(`Messages over the minimum length earn a base pay of $${amount.toFixed(2)}`);
                break;
            case "taxrate":
                db_js_1.default.guilds.setTaxRate(guild.o.id, amount / 100);
                channel.send(`Members are taxed ${amount.toFixed(2)}% of their role income on a weekly basis`);
                break;
        }
    }
}
function income(message, channel, guild, allowedRole) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!message.args || message.args.length === 0) {
            return helper_js_1.default.getUserIncome(message.sender).then((income) => {
                return channel.send(`Your daily income is $${income.toFixed(2)}`);
            });
        }
        if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
            return;
        }
        if (!message.args || message.args.length < 2) {
            return channel.send("Usage: `!Income [base $1] [scale ($1|1%)]`");
        }
        // Check for base income set
        for (let i = 0; i < message.args.length - 1; i++) {
            if (message.args[i] !== "base") {
                continue;
            }
            let amount = extractNumber(message.args[i + 1]);
            if (amount.number == null || amount.isPercent) {
                return channel.send("Please try again and specify the base pay in dollars. e.g. `!Income base $100`");
            }
            yield db_js_1.default.guilds.setBaseIncome(guild.o.id, amount.number);
        }
        let baseIncome = (yield db_js_1.default.guilds.get(guild.o.id)).base_income;
        // Income scale
        for (let i = 0; i < message.args.length - 1; i++) {
            if (message.args[i] !== "scale") {
                continue;
            }
            let amount = extractNumber(message.args[i + 1]);
            if (amount.number == null || amount.isDollar === amount.isPercent) {
                return channel.send("Please try again and specify the scale as a percent or dollar amount. e.g. `!Income scale $100` or `!Income scale 125%");
            }
            if (amount.isPercent && amount.number < 1) {
                return channel.send("Income scale must be at least 100%");
            }
            let neutralRole = helper_js_1.default.convertToRole(guild.o, discordConfig.roles.neutral);
            if (!neutralRole) {
                return channel.send("There is no neutral role");
            }
            let roles = guild.o.roles
                .filter((role) => role.hoist &&
                role.calculatedPosition >= neutralRole.calculatedPosition)
                .sort((a, b) => a.calculatedPosition - b.calculatedPosition)
                .array();
            return channel
                .send(yield setIncomeScale(baseIncome, roles, amount))
                .then(() => updateServerStatus(guild));
        }
    });
}
function setIncomeScale(baseIncome, roles, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        let nextIncome = baseIncome;
        let announcement = "";
        for (let i = 0; i < roles.length; i++) {
            yield db_js_1.default.roles.setRoleIncome(roles[i].id, nextIncome);
            announcement += `${roles[i].name} will now earn $${nextIncome.toFixed(2)}\n`;
            if (amount.isDollar) {
                nextIncome += amount.number;
            }
            else {
                nextIncome = nextIncome * amount.number;
            }
        }
        return announcement;
    });
}
function buy(message, channel, guild) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!message.args || message.args.length === 0) {
            return channel.send(`Usage: !Buy (Item Name)`);
        }
        // Get store items
        switch (message.args[0]) {
            case "promotion":
                let nextRole = helper_js_1.default.getNextRole(message.sender, guild.o);
                if (!nextRole) {
                    return channel.send(`You cannot be promoted any higher!`);
                }
                let dbRole = yield db_js_1.default.roles.getSingle(nextRole.id);
                db_js_1.default.users.get(message.sender.id, guild.o.id).then((dbUser) => {
                    if (dbUser.currency < dbRole.price) {
                        return channel.send(`You cannot afford a promotion. Promotion to ${nextRole.name} costs $${dbRole.price.toFixed(2)}`);
                    }
                    helper_js_1.default.addCurrency(message.sender, -dbRole.price);
                    helper_js_1.default.promote(channel, null, message.sender);
                });
                break;
            default:
                return channel.send(`Unknown item`);
        }
    });
}
/**
 *
 * @param {Discord.TextChannel} channel - The channel to send replies in
 * @param {Discord.GuildMember} sender - The guild member who issued the command
 * @param {String[]} args - The command arguments
 * @param {String | Discord.RoleResolvable} allowedRole - The minimum hoist role to use this command
 */
function setRolePrice(message, channel, guild, allowedRole) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
            return;
        }
        if (!message.args || message.args.length === 0) {
            return channel.send(`Usage: !RolePrice 1`);
        }
        let multiplier = extractNumber(message.args[0]).number;
        if (multiplier == null) {
            return channel.send(`Usage: !RolePrice 1`);
        }
        let announcement = `Every role's purchase price is now ${multiplier.toFixed(2)}x its daily income!\n`;
        let neutralRole = helper_js_1.default.convertToRole(guild.o, discordConfig.roles.neutral);
        if (!neutralRole) {
            return channel.send("There is no neutral role");
        }
        let discordRoles = guild.o.roles
            .filter((role) => role.hoist && role.calculatedPosition >= neutralRole.calculatedPosition)
            .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
            .array();
        for (let i = 0; i < discordRoles.length; i++) {
            let dbRole = yield db_js_1.default.roles.getSingle(discordRoles[i].id);
            let newPrice = dbRole.income * multiplier;
            db_js_1.default.roles.setRolePrice(discordRoles[i].id, newPrice);
            announcement += `${discordRoles[i].name} new price: $${newPrice.toFixed(2)}\n`;
        }
        channel.send(announcement).then(() => updateServerStatus(guild));
    });
}
function createMoney(message, channel, guild, allowedRole) {
    if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
        return;
    }
    if (message.memberMentions.length === 0 ||
        !message.args ||
        message.args.length < 2) {
        return channel.send("Usage: `!DeliverCheck @target $1`");
    }
    let amount = extractNumber(message.args[message.args.length - 1]);
    if (amount.number == null) {
        return channel.send("Usage: `!DeliverCheck @target $1`");
    }
    message.memberMentions.forEach((target) => {
        helper_js_1.default.addCurrency(target, amount.number);
    });
    channel.send("Money has been distributed!");
}
function postServerStatus(message, channel, guild, allowedRole) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!helper_js_1.default.verifyPermission(message.sender, channel, allowedRole)) {
            return;
        }
        const statusEmbed = yield generateServerStatus(guild);
        // Delete the existing status message, if it exists
        if (guild.dbGuild.status_message_id) {
            getStatusMessage(guild).then((message) => message.delete());
        }
        // We use the original channel send method here so that the status message cannot be auto-deleted.
        // This is the ONLY exception to auto-deletion
        return channel.o.send({ embed: statusEmbed }).then((message) => {
            // Update the status message in the db
            message.pin();
            return db_js_1.default.guilds.setStatusMessage(guild.o.id, message.id);
        });
    });
}
function getStatusMessage(guild) {
    return __awaiter(this, void 0, void 0, function* () {
        let textChannels = guild.o.channels
            .filter((channel) => channel.type === "text" && !channel.deleted)
            .array();
        for (let i = 0; i < textChannels.length; i++) {
            try {
                let tCh = textChannels[i];
                let message = yield tCh.fetchMessage(guild.dbGuild.status_message_id.toString());
                return message;
            }
            catch (e) { }
        }
        return null;
    });
}
function updateServerStatus(guild) {
    return __awaiter(this, void 0, void 0, function* () {
        const statusEmbed = yield generateServerStatus(guild);
        // Exit if no message to update
        if (!guild || !guild.dbGuild.status_message_id) {
            return;
        }
        // Find the existing message and update it
        getStatusMessage(guild).then((message) => message.edit({ embed: statusEmbed }));
    });
}
function generateServerStatus(guild) {
    return __awaiter(this, void 0, void 0, function* () {
        let embedFields = [];
        let discordRoles = guild.o.roles
            .filter((role) => role.hoist)
            .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
            .array();
        for (let i = 0; i < discordRoles.length; i++) {
            let dbRole = yield db_js_1.default.roles.getSingle(discordRoles[i].id);
            let roleInfo = `Daily Income: $${dbRole.income.toFixed(2)}\nPurchase Price: $${dbRole.price.toFixed(2)}\nMembers: ${discordRoles[i].members.size}`;
            if (dbRole.member_limit >= 0) {
                roleInfo += `/${dbRole.member_limit}`;
            }
            embedFields.push({
                name: discordRoles[i].name,
                value: roleInfo,
                inline: true,
            });
        }
        const statusEmbed = {
            color: 0x73f094,
            title: `SERVER STATUS`,
            timestamp: new Date(),
            fields: embedFields,
        };
        return statusEmbed;
    });
}
exports.default = {
    help,
    getInfractions,
    kick,
    report,
    exile,
    softkick,
    pardon,
    promote,
    demote,
    comfort,
    arrive,
    unarrive,
    play,
    registerVoter,
    holdVote,
    whisper,
    getCurrency,
    setAutoDelete,
    giveCurrency,
    fine,
    setEconomy,
    income,
    buy,
    setRolePrice,
    postServerStatus,
    createMoney,
};
//# sourceMappingURL=commands.js.map