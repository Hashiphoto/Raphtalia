const Discord = require('discord.js');
const client = new Discord.Client();
const permissions = require('./resources/permissions.json');
const prefix = '!';
const db = require('./db.js');
var commands = require('./commands.js');
var censorship = require('./censorship.js');
var discordConfig;

if(process.argv.length < 3) {
    console.log('Please specify -d dev or -m master');
    throw new Error("No branch specified");
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

// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
    var today = new Date();
    var now = today.getHours + ":" + today.getMinutes() + ":" + today.getSeconds
    console.log(now);
});

// Login to Discord with your app's token
client.login(discordConfig.token).then(() => {
    console.log('Logged in!');
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
    let welcomeChannel = member.guild.channels.get(discordConfig.welcomeChannelId);
    commands.arrive(welcomeChannel, member);
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
        commands.report(message.channel, sender, mentionedMembers, permissions.report);
        break;

    case 'exile' :
        commands.exile(message.channel, sender, mentionedMembers, permissions.exile);
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

    case 'arrive' :
        let welcomeChannel = sender.guild.channels.get(discordConfig.welcomeChannelId);
        commands.arrive(welcomeChannel, sender);
        break;

    case 'unarrive' : 
        commands.unarrive(message.channel, sender, mentionedMembers);
        break;

    case 'pledge' :
        commands.pledge(message.channel, sender, args);
        break;
    
    default:
        message.channel.send('Nani the fuck is that command? òwó');
    }
}

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