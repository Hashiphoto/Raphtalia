import Discord from "discord.js";
import dayjs from "dayjs";
import commands from "./commands.js";
import helper from "./helper.js";
import censorship from "./censorship.js";
import db from "./db.js";
import secretConfig from "../config/secrets.config.js";
import discordConfig from "../config/discord.config.js";
import tasks from "./scheduled-tasks.js";

const client = new Discord.Client();
const prefix = "!";

// require("log-timestamp")(() => {
// 	return `[${dayjs().format(`MMMD,YY|hh:mm:ssA`)}] %s`;
// });

/**
 * When the client is ready, do this once
 */
client.once("ready", () => {
	console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});

client.login(secretConfig().discord.token).then(() => {
	console.log(`Logged in! Listening for events...`);
});

tasks.init(client);

client.on("message", (message) => {
	if (message.author.bot) {
		return;
	}

	if (message.channel.type === "dm" || message.type !== "DEFAULT") {
		return;
	}

	attachWatchCommand(message.channel).then((deleteTime) => {
		if (deleteTime >= 0) {
			setTimeout(function () {
				message.delete().catch((error) => {
					console.error("Message was probably already deleted\n" + error);
				});
			}, deleteTime);
		}
		if (message.content.startsWith(prefix)) {
			processCommand(message);
		} else {
			censorship
				.censorMessage(message)
				.then((censored) => {
					if (censored || message.channel.autoDelete) return;
					return db.guilds.get(message.guild.id);
				})
				.then((dbGuild) => {
					if (!dbGuild) return;
					if (message.content.length < dbGuild.min_length) return;

					let amount = Math.min(
						dbGuild.base_payout +
							message.content.length * dbGuild.character_value,
						dbGuild.max_payout
					);

					let sender = message.guild.members.get(message.author.id);

					if (process.env.NODE_ENV === "dev") {
						// message.channel.send(`\`Debug only\` | ${sender} +$${amount.toFixed(2)}`);
					}
					return helper.addCurrency(sender, amount);
				});
		}
	});
});

client.on("guildMemberAdd", (member) => {
	const welcomeChannel = client.channels.get(
		discordConfig().channels.welcomeChannelId
	);
	attachWatchCommand(welcomeChannel).then(() => {
		commands.arrive(welcomeChannel, member);
	});
});

client.on("guildMemberRemove", (member) => {
	db.users.setCitizenship(member.id, member.guild.id, false);
});

client.on("disconnect", function (event) {
	console.log("Bot disconnecting");
	process.exit();
});

function attachWatchCommand(channel) {
	return db.channels.get(channel.id).then((dbChannel) => {
		let deleteTime = -1;
		if (dbChannel && dbChannel.delete_ms >= 0) {
			deleteTime = dbChannel.delete_ms;
		}
		channel.autoDelete = deleteTime >= 0;
		channel.watchSend = function (content) {
			return this.send(content).then((message) => {
				if (deleteTime >= 0) {
					message.delete(deleteTime);
				}
				return message;
			});
		};

		return deleteTime;
	});
}

async function processCommand(message) {
	// args contains every word after the command in an array
	const args = message.content.slice(prefix.length).split(/\s+/);
	const command = args.shift().toLowerCase();
	let sender = message.guild.members.get(message.author.id);

	// mentionedMembers contains every mention in order in an array
	let mentionedMembers = getMemberMentions(message.guild, args);
	let mentionedRoles = getRoleMentions(message.guild, args);
	let responseChannel = message.channel;

	switch (command) {
		case "help":
			commands.help(responseChannel, sender);
			break;

		case "infractions":
			commands.getInfractions(responseChannel, sender, mentionedMembers);
			break;

		case "kick":
			commands.kick(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov
			);
			break;

		case "infract":
		case "report":
			commands.report(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov,
				args
			);
			break;

		case "exile":
			commands.exile(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov,
				helper.parseTime(message.content)
			);
			break;

		case "softkick":
			commands.softkick(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov
			);
			break;

		case "pardon":
			commands.pardon(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.leader
			);
			break;

		case "promote":
			commands.promote(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov
			);
			break;

		case "demote":
			commands.demote(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov
			);
			break;

		case "comfort":
			commands.comfort(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.leader
			);
			break;

		// TESTING ONLY
		case "unarrive":
			commands.unarrive(
				responseChannel,
				sender,
				mentionedMembers,
				discordConfig().roles.gov
			);
			break;

		case "anthem":
		case "sing":
		case "play":
			commands.play(
				responseChannel,
				sender,
				message.content,
				discordConfig().roles.gov
			);
			break;

		case "banword":
		case "banwords":
		case "bannedwords":
			censorship.banWords(
				responseChannel,
				sender,
				args,
				discordConfig().roles.gov
			);
			break;

		case "allowword":
		case "allowwords":
		case "unbanword":
		case "unbanwords":
			censorship.allowWords(
				responseChannel,
				sender,
				args,
				discordConfig().roles.gov
			);
			break;

		case "enablecensorship":
			censorship.enable(
				responseChannel,
				sender,
				true,
				discordConfig().roles.leader
			);
			break;

		case "disablecensorship":
			censorship.enable(
				responseChannel,
				sender,
				false,
				discordConfig().roles.leader
			);
			break;

		case "register":
			commands.registerVoter(responseChannel, sender);
			break;

		case "holdvote":
			commands.holdVote(
				responseChannel,
				sender,
				mentionedMembers,
				message.content,
				discordConfig().roles.leader
			);
			break;

		// Needs more work for it to be useful
		// case 'whisper':
		//     commands.whisper(responseChannel, sender, mentionedMembers, message.content, discordConfig().roles.leader);
		//     break;

		case "wallet":
		case "balance":
		case "cash":
		case "bank":
		case "money":
		case "currency":
			commands.getCurrency(sender);
			break;

		case "autodelete":
			commands.setAutoDelete(
				responseChannel,
				sender,
				args,
				discordConfig().roles.leader
			);
			break;

		case "give":
			commands.giveCurrency(responseChannel, sender, mentionedMembers, args);
			break;

		case "fine":
			commands.fine(
				responseChannel,
				sender,
				mentionedMembers,
				args,
				discordConfig().roles.gov
			);
			break;

		case "economy":
			commands.setEconomy(
				responseChannel,
				sender,
				args,
				discordConfig().roles.leader
			);
			break;

		case "income":
			commands.income(
				responseChannel,
				sender,
				mentionedMembers,
				mentionedRoles,
				args,
				discordConfig().roles.leader
			);
			break;

		case "doincome":
			if (process.env.NODE_ENV !== "dev") {
				break;
			}
			tasks.dailyIncome(message.guild);
			responseChannel.send("`Debug only` | Income has been distributed");
			break;

		case "dotaxes":
			if (process.env.NODE_ENV !== "dev") {
				break;
			}
			tasks.tax(message.guild);
			responseChannel.send("`Debug only` | Members have been taxed");
			break;

		case "purchase":
		case "buy":
			commands.buy(responseChannel, sender, args);
			break;

		case "roleprice":
			commands.setRolePrice(
				responseChannel,
				sender,
				args,
				discordConfig().roles.leader
			);
			break;

		case "delivercheck":
			commands.createMoney(
				responseChannel,
				sender,
				mentionedMembers,
				args,
				discordConfig().roles.leader
			);
			break;

		case "serverstatus":
			commands.postServerStatus(
				responseChannel,
				sender,
				discordConfig().roles.leader
			);
			break;

		default:
			if (responseChannel) {
				responseChannel.watchSend(`I think you're confused, Comrade ${sender}`);
			}
	}
}

/**
 * Parses args and returns the user mentions in the order given
 *
 * @param {Discord.Guild} guild - The guild to search for members/roles
 * @param {String[]} args - An array of strings to parse for mentions
 * @returns {Discord.GuildMember[]} - An array of guildMember objects
 */
function getMemberMentions(guild, args) {
	let members = [];
	for (let i = 0; i < args.length; i++) {
		let member = getMemberFromMention(guild, args[i]);
		if (!member) {
			continue;
		}
		members = members.concat(member);
	}

	return members;
}

/**
 * Parses args and returns the user mentions in the order given
 *
 * @param {Discord.Guild} guild - The guild to search for members/roles
 * @param {String[]} args - An array of strings to parse for mentions
 * @returns {Discord.GuildMember[]} - An array of guildMember objects
 */
function getRoleMentions(guild, args) {
	let roles = [];
	for (let i = 0; i < args.length; i++) {
		let roleMatches = args[i].match(/<@&(\d+)>/);
		if (roleMatches) {
			let role = guild.roles.get(roleMatches[1]);
			roles.push(role);
		}
	}

	return roles;
}

/**
 * Removes the prefix and suffix characters from a mention.
 * Discord mentions are the user or role id surrounded by < > and other characters
 * Read the Discord.js documentation for more info
 *
 * @param {String} mention - A string containing a mention
 * @returns {Discord.GuildMember} The guild member that the mention refers to
 */
function getMemberFromMention(guild, mention) {
	// The id is the first and only match found by the RegEx.
	let memberMatches = mention.match(/<@!?(\d+)>/);
	if (memberMatches) {
		// The first element in the matches array will be the entire mention, not just the ID,
		// so use index 1.
		return guild.members.get(memberMatches[1]);
	}

	// Check if a role was mentioned instead
	let roleMatches = mention.match(/<@&(\d+)>/);
	if (roleMatches) {
		let role = guild.roles.get(roleMatches[1]);
		return role.members.array();
	}
}

export default client;
