// Node libraries
import Discord from "discord.js";
import dayjs from "dayjs";

// Files
import links from "../resources/links.js";
import helper from "./helper.js";
import db from "./db.js";
import welcomeQuestions from "../resources/welcome-questions.js";
import youtube from "./youtube.js";
import censorship from "./censorship.js";
import discordConfig from "../config/discord.config.js";

/**
 * Very unhelpful at the moment
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 */
function help(channel, sender) {
	if (channel) {
		if (channel) channel.watchSend(`Help yourself, ${sender}`);
	}
}

/**
 * Reports the number of infractions for a list of guildMembers. Pass in an empty array
 * for targets or leave it as null to report the sender's infractions instead
 *
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - Whoever issued the command
 * @param {Discord.GuildMember[]} targets An array of guildMember objects to get the infractions for
 */
function getInfractions(channel, sender, targets) {
	if (targets == null || targets.length === 0) {
		helper.reportInfractions(sender, channel);
	} else {
		helper.reportInfractions(targets[0], channel);
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
function kick(channel, sender, targets, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who is getting the boot"
			);
		return;
	}

	targets.forEach((target) => {
		target
			.kick()
			.then((member) => {
				let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
				let kickGif = links.gifs.kicks[randInt];
				if (channel)
					channel.watchSend(
						`:wave: ${member.displayName} has been kicked\n${kickGif}`
					);
			})
			.catch((e) => {
				if (channel) channel.watchSend("Something went wrong...");
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
function report(channel, sender, targets, allowedRole, args = null) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who is being reported"
			);
		return;
	}

	let amount = 1;

	for (let i = 0; i < args.length; i++) {
		let relMatches = args[i].match(/^\+?\d+$/g);
		if (relMatches) {
			amount = parseInt(relMatches[0]);
			break;
		}
	}

	targets.forEach((target) => {
		helper.addInfractions(target, channel, amount, "Yes sir~!");
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
function exile(channel, sender, targets, allowedRole, releaseDate) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who is being exiled"
			);
		return;
	}

	targets.forEach((target) => {
		helper.exile(target, channel, releaseDate);
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
function softkick(channel, sender, targets, allowedRole, reason = "") {
	if (
		sender != null &&
		!helper.verifyPermission(sender, channel, allowedRole)
	) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who is being gently kicked"
			);
		return;
	}

	targets.forEach((target) => {
		helper.softkick(channel, target, reason);
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
function pardon(channel, sender, targets, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who is being pardoned"
			);
		return;
	}

	targets.forEach((target) => {
		helper.pardon(target, channel);
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
function promote(channel, sender, targets, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel) return;
	}

	targets.forEach((target) => {
		helper.promote(channel, sender, target);
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
function demote(channel, sender, targets, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who is being demoted"
			);
		return;
	}

	targets.forEach((target) => {
		helper.demote(channel, sender, target);
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
function comfort(channel, sender, targets, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}
	if (!channel) return;

	if (targets.length === 0) {
		channel.watchSend(
			"Please repeat the command and specify who I'm headpatting"
		);
		return;
	}

	targets.forEach((member) => {
		channel.watchSend(member.toString() + " headpat");
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
	if (!channel) return;
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
			return channel.awaitMessages(filter, {
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
			helper.softkick(channel, member, "We don't allow those words here");
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
		helper.softkick(
			channel,
			member,
			"Come join the Gulag when you're feeling more agreeable."
		);
		return false;
	}
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
async function arrive(channel, member) {
	if (!channel) return;
	await helper.setHoistedRole(member, discordConfig().roles.immigrant);

	let dbUser = await db.users.get(member.id, member.guild.id);

	// Check if already a citizen
	if (dbUser.citizenship) {
		channel.watchSend(`Welcome back ${member}!`);
		helper.setHoistedRole(member, discordConfig().roles.neutral);
		return;
	}

	channel.watchSend(
		`Welcome ${member} to ${channel.guild.name}!\n` +
			`I just have a few questions for you first. If you answer correctly, you will be granted citizenship.`
	);

	// Set nickname
	try {
		let nickname = await sendTimedMessage(
			channel,
			member,
			welcomeQuestions.nickname
		);
		if (await censorship.containsBannedWords(channel.guild.id, nickname)) {
			helper.softkick(
				channel,
				member,
				"We don't allow those words around here"
			);
			return;
		}
		channel.watchSend(`${member.displayName} will be known as ${nickname}!`);
		member.setNickname(nickname).catch((e) => {
			console.error(e);
			channel.watchSend(
				`Sorry. I don't have permissions to set your nickname...`
			);
		});
	} catch (e) {
		console.error(e);
		channel.watchSend(`${member} doesn't want a nickname...`);
	}

	for (let i = 0; i < welcomeQuestions.gulagQuestions.length; i++) {
		let answeredCorrect = await askGateQuestion(
			channel,
			member,
			welcomeQuestions.gulagQuestions[i]
		);
		if (!answeredCorrect) {
			return;
		}
	}

	// Creates the user in the DB if they didn't exist
	db.users.setCitizenship(member.id, member.guild.id, true);
	channel
		.watchSend(
			`Thank you! And welcome loyal citizen to ${channel.guild.name}! 🎉🎉🎉`
		)
		.then(() => {
			helper.setHoistedRole(member, discordConfig().roles.neutral);
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
function unarrive(channel, sender, targets, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	let target = sender;
	if (targets.length > 0) {
		target = targets[0];
	}
	return db.users
		.setCitizenship(target.id, member.guild.id, false)
		.then(() => {
			return target.roles.forEach((role) => {
				target.removeRole(role);
			});
		})
		.then(() => {
			if (channel)
				return channel.watchSend(
					`${target}'s papers have been deleted from record`
				);
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
function play(channel, sender, content, allowedRole) {
	let voiceChannel = null;
	let volume = 0.5;
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
		if (!helper.verifyPermission(sender, channel, allowedRole)) {
			return;
		}

		firstMatch = matches[0].slice(3).trim(); // remove the "in "
		matches = content.match(/\/[\w ]+/); // Everything after the first slash (/), if it exists

		// The first match is the category and the second match is the channel name
		if (matches != null) {
			// remove the "in "
			secondMatch = matches[0].slice(1).trim();
			voiceChannel = sender.guild.channels.find(
				(channel) =>
					channel.type == "voice" &&
					channel.name.toLowerCase() === secondMatch.toLowerCase() &&
					channel.parent &&
					channel.parent.name.toLowerCase() === firstMatch.toLowerCase()
			);
			if (voiceChannel == null) {
				if (channel)
					channel.watchSend("I couldn't find a voice channel by that name");
				return;
			}
		}

		// If there is second parameter, then firstMatch is the voice channel name
		else {
			voiceChannel = sender.guild.channels.find(
				(channel) =>
					channel.type == "voice" &&
					channel.name.toLowerCase() === firstMatch.toLowerCase()
			);
			if (voiceChannel == null) {
				if (channel)
					channel.watchSend("I couldn't find a voice channel by that name");
				return;
			}
		}
	}

	// If no voice channel was specified, play the song in the vc the sender is in
	if (voiceChannel == null) {
		voiceChannel = sender.voiceChannel;

		if (!voiceChannel) {
			if (channel)
				return channel.watchSend("Join a voice channel first, comrade!");
			return;
		}
	}
	const permissions = voiceChannel.permissionsFor(sender.client.user);
	if (
		!permissions.has("VIEW_CHANNEL") ||
		!permissions.has("CONNECT") ||
		!permissions.has("SPEAK")
	) {
		return channel.watchSend("I don't have permission to join that channel");
	}
	return youtube.play(voiceChannel, links.youtube.anthem, volume);
}

function registerVoter(channel, sender) {
	helper
		.addRoles(sender, [discordConfig().roles.voter])
		.then(() => {
			if (channel) channel.watchSend(`You are now a registered voter!`);
		})
		.catch(() => {
			if (channel) channel.watchSend(`You are already registered, dingus`);
		});
}

function holdVote(channel, sender, mentionedMembers, content, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	// Remove the command
	content = content.replace(/^!\w+\s+/, "");

	// Replace the mentions with their nicknames and tags
	for (let i = 0; i < mentionedMembers.length; i++) {
		let re = new RegExp(`<@!?${mentionedMembers[i].id}>`);
		let plainText = mentionedMembers[i].user.tag;
		if (mentionedMembers[i].nickname) {
			plainText += ` (${mentionedMembers[i].nickname})`;
		}
		content = content.replace(re, plainText);
	}

	// Get the duration and remove it from the command. It must come at the end
	let timeMatches = content.match(/(\s*\d+[dhms]){1,4}\s*$/gi);
	let endDate;
	if (timeMatches == null) {
		endDate = helper.parseTime("1h");
	} else {
		let timeText = timeMatches[0];
		content = content.slice(0, -timeText.length).trim();
		endDate = helper.parseTime(timeText);
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
		if (channel)
			channel.watchSend(
				"Please try again and specify the options of the vote\nEx: `!HoldVote option a, option b  3h 30m`"
			);
		return;
	}

	// Send out the voting messages
	if (channel)
		channel.watchSend(
			`Voting begins now and ends at ${endDate.format(helper.dateFormat)}`
		);

	let message = {
		prompt:
			`**A vote is being held in ${sender.guild.name}!**\n` +
			`Please vote for one of the options below by replying with the number of the choice.\n` +
			`Voting ends at ${endDate.format(helper.dateFormat)}\n\n${textOptions}`,
		answer: answersRegEx,
		timeout: duration,
		strict: false,
	};

	let voters = helper.convertToRole(sender.guild, discordConfig().roles.voter)
		.members;
	if (voters.size === 0) {
		if (channel) channel.watchSend(`There are no registered voters :monkaS:`);
		return;
	}

	voters.forEach((voter) => {
		let dmChannel;
		voter
			.createDM()
			.then((channel) => {
				dmChannel = channel;
				return sendTimedMessage(dmChannel, voter, message, false);
			})
			.then((choice) => {
				let msg = `Thank you for your vote!`;
				if (channel)
					msg += `\nResults will be announced in **${sender.guild.name}/#${channel.name}** when voting is closed`;
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
		if (channel) channel.watchSend(finalResults);
	}, duration);
}

function percentFormat(number) {
	if (isNaN(number)) {
		number = 0;
	}
	return (number * 100).toFixed(2);
}

function whisper(channel, sender, targets, content, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0) {
		if (channel)
			channel.watchSend(
				"Please repeat the command and specify who I am whispering to"
			);
		return;
	}
	// remove the command and targeet from the content
	content = content.replace(/^\S+\s+<@!?(\d+)>\s+/, "");

	targets[0].send(content);
}

/**
 * Reports the currency for a list of guildMembers. Pass in an empty array
 * for targets or leave it as null to report the sender's infractions instead
 *
 * @param {Discord.GuildMember} sender - Whoever issued the command
 * @param {Discord.GuildMember[]} targets An array of guildMember objects to get the infractions for
 */
function getCurrency(sender) {
	sender.createDM().then((dmChannel) => {
		helper.reportCurrency(sender, dmChannel);
	});
}

function setAutoDelete(channel, sender, args, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}
	if (!args || args.length === 0) {
		if (channel)
			channel.watchSend("Usage: `AutoDelete (start|stop) [delete delay ms]`");
		return;
	}

	let clearHistory = false;
	let enable = null;
	let deleteDelay = 2000;
	for (let i = 0; i < args.length; i++) {
		switch (args[i].toLowerCase()) {
			case "start":
				enable = true;
				break;
			case "stop":
				enable = false;
				break;
			case "clear":
				clearHistory = true;
			default:
				let num = parseInt(args[i]);
				if (isNaN(num)) {
					continue;
				}
				deleteDelay = num;
		}
	}

	if (enable === null) {
		if (channel)
			channel.watchSend("Usage: `AutoDelete (start|stop) [delete delay ms]`");
		return;
	}

	if (!enable) {
		deleteDelay = -1;
	}

	db.channels.setAutoDelete(channel.id, deleteDelay).then(() => {
		if (enable) {
			// clear all msgs
			if (clearHistory) {
				clearChannel(channel);
			}

			if (channel) {
				channel.send(`Messages are deleted after ${deleteDelay}ms`);
			}
		} else {
			if (channel) {
				channel.send("Messages are no longer deleted");
			}
		}
	});
}

async function clearChannel(channel) {
	let pinnedMessages = await channel.fetchPinnedMessages();
	let fetched;
	do {
		fetched = await channel.fetchMessages({ limit: 100 });
		await channel.bulkDelete(fetched.filter((message) => !message.pinned));
	} while (fetched.size > pinnedMessages.size);
}

function giveCurrency(channel, sender, targets, args) {
	if (!args || args.length === 0) {
		if (channel)
			channel.watchSend("Please try again and specify the amount of money");
		return;
	}

	let amount = 1;
	args.forEach((arg) => {
		let temp = extractNumber(arg).number;
		if (temp) {
			amount = temp;
			return;
		}
	});
	if (amount < 0) {
		return helper.addInfractions(
			sender,
			channel,
			1,
			"What are you trying to pull?"
		);
	}
	let totalAmount = amount * targets.length;
	db.users.get(sender.id, sender.guild.id).then((dbUser) => {
		if (dbUser.currency < totalAmount) {
			return channel.watchSend("You don't have enough money for that");
		}
		helper.addCurrency(sender, -totalAmount);
		targets.forEach((target) => {
			helper.addCurrency(target, amount);
		});
		channel.watchSend("Money transferred!");
	});
}

function fine(channel, sender, targets, args, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}
	if (!targets || targets.length === 0) {
		return channel.watchSend("Please try again and specify who is being fined");
	}

	let amount = 1;
	args.forEach((arg) => {
		let temp = extractNumber(arg).number;
		if (temp) {
			amount = temp;
			return;
		}
	});
	helper.addCurrency(sender, amount * targets.length);
	for (let i = 0; i < targets.length; i++) {
		helper.addCurrency(targets[i], -amount);
	}
	let message =
		`Fined $${amount.toFixed(2)}` + (targets.length > 1 ? ` each!` : `!`);
	channel.send(message);
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

function setEconomy(channel, sender, args, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}
	if (!args || args.length <= 1) {
		return channel.watchSend(
			"Usage: `Economy [MinLength $1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`"
		);
	}

	for (let i = 0; i < args.length - 1; i += 2) {
		let amount = extractNumber(args[i + 1]).number;
		if (amount == null)
			return channel.watchSend("Could not understand arguments");

		switch (args[i].toLowerCase()) {
			case "minlength":
				db.guilds.setMinLength(sender.guild.id, amount);
				channel.watchSend(
					`The minimum length for a message to be a paid is now ${amount.toFixed(
						0
					)} characters`
				);
				break;
			case "charvalue":
				db.guilds.setCharacterValue(sender.guild.id, amount);
				channel.watchSend(
					`Messages over the minimum length earn $${amount.toFixed(
						2
					)} per character`
				);
				break;
			case "maxpayout":
				db.guilds.setMaxPayout(sender.guild.id, amount);
				channel.watchSend(
					`The max value earned from a paid message is now $${amount.toFixed(
						2
					)}`
				);
				break;
			case "basepayout":
				db.guilds.setBasePayout(sender.guild.id, amount);
				channel.watchSend(
					`Messages over the minimum length earn a base pay of $${amount.toFixed(
						2
					)}`
				);
				break;
			case "taxrate":
				db.guilds.setTaxRate(sender.guild.id, amount / 100);
				channel.watchSend(
					`Members are taxed ${amount.toFixed(
						2
					)}% of their role income on a weekly basis`
				);
				break;
		}
	}
}

async function income(
	channel,
	sender,
	mentionedMembers,
	mentionedRoles,
	args,
	allowedRole
) {
	if (!args || args.length === 0) {
		return helper.getUserIncome(sender).then((income) => {
			return channel.watchSend(`Your daily income is $${income.toFixed(2)}`);
		});
	}
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}
	if (!args || args.length < 2) {
		return channel.watchSend("Usage: `!Income [base $1] [scale ($1|1%)]`");
	}

	// Check for base income set
	for (let i = 0; i < args.length - 1; i++) {
		if (args[i] !== "base") {
			continue;
		}
		let amount = extractNumber(args[i + 1]);
		if (amount.number == null || amount.isPercent) {
			return channel.watchSend(
				"Please try again and specify the base pay in dollars. e.g. `!Income base $100`"
			);
		}
		await db.guilds.setBaseIncome(channel.guild.id, amount.number);
	}

	let baseIncome = (await db.guilds.get(channel.guild.id)).base_income;

	// Income scale
	for (let i = 0; i < args.length - 1; i++) {
		if (args[i] !== "scale") {
			continue;
		}

		let amount = extractNumber(args[i + 1]);
		if (amount.number == null || amount.isDollar === amount.isPercent) {
			return channel.watchSend(
				"Please try again and specify the scale as a percent or dollar amount. e.g. `!Income scale $100` or `!Income scale 125%"
			);
		}
		if (amount.isPercent && amount.number < 1) {
			return channel.watchSend("Income scale must be at least 100%");
		}
		let neutralRole = helper.convertToRole(
			sender.guild,
			discordConfig().roles.neutral
		);
		if (!neutralRole) {
			return channel.watchSend("There is no neutral role");
		}
		let roles = channel.guild.roles
			.filter(
				(role) =>
					role.hoist &&
					role.calculatedPosition >= neutralRole.calculatedPosition
			)
			.sort((a, b) => a.calculatedPosition - b.calculatedPosition)
			.array();

		return channel
			.watchSend(await setIncomeScale(baseIncome, roles, amount))
			.then(updateServerStatus(channel));
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

async function buy(channel, sender, args) {
	if (!args || args.length === 0) {
		return channel.watchSend(`Usage: !Buy (Item Name)`);
	}
	// Get store items
	switch (args[0]) {
		case "promotion":
			let nextRole = helper.getNextRole(sender, sender.guild);
			if (!nextRole) {
				return channel.watchSend(`You cannot be promoted any higher!`);
			}

			let dbRole = await db.roles.getSingle(nextRole.id);
			db.users.get(sender.id, sender.guild.id).then((dbUser) => {
				if (dbUser.currency < dbRole.price) {
					return channel.watchSend(
						`You cannot afford a promotion. Promotion to ${
							nextRole.name
						} costs $${dbRole.price.toFixed(2)}`
					);
				}
				helper.addCurrency(sender, -dbRole.price);
				helper.promote(channel, null, sender);
			});
			break;
		default:
			return channel.watchSend(`Unknown item`);
	}
}

/**
 *
 * @param {Discord.TextChannel} channel - The channel to send replies in
 * @param {Discord.GuildMember} sender - The guild member who issued the command
 * @param {String[]} args - The command arguments
 * @param {String | Discord.RoleResolvable} allowedRole - The minimum hoist role to use this command
 */
async function setRolePrice(channel, sender, args, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (!args || args.length === 0) {
		return channel.watchSend(`Usage: !RolePrice 1`);
	}
	let multiplier = extractNumber(args[0]).number;
	if (multiplier == null) {
		return channel.watchSend(`Usage: !RolePrice 1`);
	}

	let announcement = `Every role's purchase price is now ${multiplier.toFixed(
		2
	)}x its daily income!\n`;
	let neutralRole = helper.convertToRole(
		sender.guild,
		discordConfig().roles.neutral
	);
	if (!neutralRole) {
		return channel.watchSend("There is no neutral role");
	}
	let discordRoles = channel.guild.roles
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
	channel.watchSend(announcement).then(updateServerStatus(channel));
}

function createMoney(channel, sender, targets, args, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}

	if (targets.length === 0 || !args || args.length < 2) {
		return channel.watchSend("Usage: `!DeliverCheck @target $1`");
	}

	let amount = extractNumber(args[args.length - 1]);
	if (amount.number == null) {
		return channel.watchSend("Usage: `!DeliverCheck @target $1`");
	}

	targets.forEach((target) => {
		helper.addCurrency(target, amount.number);
	});
	channel.watchSend("Money has been distributed!");
}

async function postServerStatus(channel, sender, allowedRole) {
	if (!helper.verifyPermission(sender, channel, allowedRole)) {
		return;
	}
	const statusEmbed = await generateServerStatus(channel.guild);

	db.guilds
		.get(channel.guild.id)
		.then(async (guild) => {
			// Delete the existing status message, if it exists
			if (!guild || !guild.status_message_id) {
				return;
			}
			let textChannels = channel.guild.channels
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
			return channel.send({ embed: statusEmbed });
		})
		.then((message) => {
			// Update the status message in the db
			message.pin();
			return db.guilds.setStatusMessage(channel.guild.id, message.id);
		});
}

async function updateServerStatus(channel) {
	const statusEmbed = await generateServerStatus(channel.guild);

	return db.guilds.get(channel.guild.id).then(async (guild) => {
		// Exit if no message to update
		if (!guild || !guild.status_message_id) {
			return;
		}
		// Find the existing message and update it
		let textChannels = channel.guild.channels
			.filter((channel) => channel.type === "text" && !channel.deleted)
			.array();
		for (let i = 0; i < textChannels.length; i++) {
			try {
				let message = await textChannels[i].fetchMessage(
					guild.status_message_id
				);
				message.edit({ embed: statusEmbed });
				break;
			} catch (e) {}
		}
	});
}

async function generateServerStatus(guild) {
	let embedFields = [];
	let discordRoles = guild.roles
		.filter((role) => role.hoist)
		.sort((a, b) => b.calculatedPosition - a.calculatedPosition)
		.array();
	for (let i = 0; i < discordRoles.length; i++) {
		let dbRole = await db.roles.getSingle(discordRoles[i].id);
		let roleInfo = `Daily Income: $${dbRole.income.toFixed(
			2
		)}\nPurchase Price: $${dbRole.price.toFixed(2)}\nMembers: ${
			discordRoles[i].members.size
		}`;
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
}

export default {
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
