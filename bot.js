const Discord = require('discord.js');
const client = new Discord.Client();
const permissions = require('./resources/permissions.json');
const prefix = '!';
const commands = require('./commands.js');
const helper = require('./helper.js');
const censorship = require('./censorship.js');
const db = require('./db.js');
var discordConfig;

if(process.argv.length < 3) {
    console.log('Please specify -d dev or -m master');
    throw new Error('No branch specified. Please specify -d dev or -m master');
}

// Check for master or dev branch configuration
process.argv.forEach(function(value, index, array) {
    // skip 'node' and the name of the app
    if(index < 2) {
        return;
    }
    if(value === '-d') {
        discordConfig = require('./config/discord-config-development.json');
    }
    else if(value === '-m') {
        discordConfig = require('./config/discord-config-master.json');
    }
})

/**
 * When the client is ready, do this once
 */
client.once('ready', () => {
    let date = new Date();
    let now = date.toLocaleTimeString();
    console.log(`Ready at ${now}`);
});

client.login(discordConfig.token)
.then(() => {
    console.log(`Logged in! Listening for events...`);
});

client.on('message', message => {
    if(message.author.bot) {
        return;
    }

    if(message.content.startsWith(prefix)) {
        processCommand(message);
    }
    else {
        censorship.censor(message)
    }
})

client.on('guildMemberAdd', (member) => {
    const welcomeChannel = client.channels.get(discordConfig.welcomeChannelId);
    commands.arrive(welcomeChannel, member);
})

client.on('guildMemberRemove', (member) => {
    db.papers.delete(member.id);
})

client.on("disconnect", function(event) {
    console.log('Bot disconnecting');
    process.exit();
});

function processCommand(message) {
    // args contains every word after the command in an array
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    let sender = message.guild.members.get(message.author.id);
    // mentionedMembers contains every mention in order in an array
    let mentionedMembers = getMemberMentions(message.guild, args);

    switch(command) {
    case 'help' :
        commands.help(message.channel, sender);
        break;

    case 'infractions' :
        commands.getInfractions(message.channel, sender, mentionedMembers);
        break;

    case 'kick' :
        commands.kick(message.channel, sender, mentionedMembers, permissions.kick);
        break;

    case 'infract' :
    case 'report' :
        commands.report(message.channel, sender, mentionedMembers, permissions.report, args);
        break;

    case 'exile' :
        commands.exile(message.channel, sender, mentionedMembers, permissions.exile, helper.parseTime(message.content));
        break;

    case 'softkick' :
        commands.softkick(message.channel, sender, mentionedMembers, permissions.kick);
        break;

    case 'pardon' :
        commands.pardon(message.channel, sender, mentionedMembers, permissions.pardon);
        break;

    case 'promote' :
        commands.promote(message.channel, sender, mentionedMembers, permissions.promote);
        break;

    case 'demote' :
        commands.demote(message.channel, sender, mentionedMembers, permissions.promote);
        break;

    case 'comfort' :
        commands.comfort(message.channel, sender, mentionedMembers, permissions.comfort);
        break;

    // TESTING ONLY
    case 'arrive' :
        commands.arrive(message.channel, sender);
        break;
    
    // TESTING ONLY
    case 'unarrive' : 
        commands.unarrive(message.channel, sender, mentionedMembers);
        break;

    case 'anthem':
    case 'sing':
    case 'play':
        commands.play(message.channel, sender, args);
        break;

    default:
        message.channel.send(`I think you're confused, Comrade ${sender}`);
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
    for(let i = 0; i < args.length; i++) {
        let user = getUserFromMention(args[i]);
        if(!user) {
            continue;
        }
        let guildMember = guild.members.get(user.id);

        if(!guildMember) {
            console.log('Could not find that member');
            return;
        }

        members.push(guildMember);
    }

    return members;
}

/**
 * Removes the prefix and suffix characters from a mention.
 * Discord mentions are the user or role id surrounded by < > and other characters
 * Read the Discord.js documentation for more info
 * 
 * @param {String} mention - A string containing a mention 
 * @returns {Discord.GuildMember} The guild member that the mention refers to
 */
function getUserFromMention(mention) {
	// The id is the first and only match found by the RegEx.
	let matches = mention.match(/^<@!?(\d+)>$/);

	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) {
        return;
    }

	// However the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	let id = matches[1];

	return client.users.get(id);
}