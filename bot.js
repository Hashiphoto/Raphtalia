// Node libraries
const Discord = require('discord.js');

// Files
const commands = require('./commands.js');
const helper = require('./helper.js');
const censorship = require('./censorship.js');
const db = require('./db.js');
const secretConfig = require('./config/secrets.json')[process.env.NODE_ENV || 'dev'];
const discordConfig = require('./config/discord.json')[process.env.NODE_ENV || 'dev'];

// Objects
const client = new Discord.Client();
const prefix = '!';

/**
 * When the client is ready, do this once
 */
client.once('ready', () => {
    let date = new Date();
    let now = date.toLocaleTimeString();
    console.log(`Ready at ${now}`);
});

client.login(secretConfig.discord.token)
.then(() => {
    console.log(`Logged in! Listening for events. NODE_ENV: ${process.env.NODE_ENV}`);
})

client.on('message', message => {
    if(message.author.bot) {
        return;
    }

    if(message.channel.type === "dm" || message.type !== "DEFAULT") {
        return;
    }
    
    attachWatchCommand(message.channel)
    .then(deleteTime => {
        if(deleteTime >= 0) {
            setTimeout(function() {
                message.delete()
                .catch(error => {
                    console.error('Message was probably already deleted\n' + error);
                })
            }, deleteTime);
        }
        if(message.content.startsWith(prefix)) {
            processCommand(message);
        }
        else {
            censorship.censorMessage(message)
            .then(censored => {
                if(censored) return;

                let amount = ((message.content.length - 20) / 4);
                if(amount <= 0) return;
                
                let sender = message.guild.members.get(message.author.id);
                message.channel.send(`\`Debug only\` | ${sender} +$${amount.toFixed(2)}`);
                return helper.addCurrency(sender, amount)
            })
        }
    })
})

client.on('guildMemberAdd', (member) => {
    const welcomeChannel = client.channels.get(discordConfig.channels.welcomeChannelId);
    attachWatchCommand(welcomeChannel)
    .then(() => {
        commands.arrive(welcomeChannel, member);
    })
})

client.on('guildMemberRemove', (member) => {
    db.users.setCitizenship(member.id, member.guild.id, false);
})

client.on("disconnect", function(event) {
    console.log('Bot disconnecting');
    process.exit();
});

function attachWatchCommand(channel) {
    return db.channels.get(channel.id)
    .then(dbChannel => {
        let deleteTime = -1;
        if(dbChannel && dbChannel.delete_ms >= 0) {
            deleteTime = dbChannel.delete_ms;
        }
        channel.watchSend = function(content) {
            return this.send(content)
            .then(message => {
                if(deleteTime >= 0) {
                    message.delete(deleteTime);
                }
                return message;
            })
        }

        return deleteTime;
    })
}

async function processCommand(message) {
    // args contains every word after the command in an array
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    let sender = message.guild.members.get(message.author.id);

    // mentionedMembers contains every mention in order in an array
    let mentionedMembers = getMemberMentions(message.guild, args);
    let responseChannel = message.channel;

    switch(command) {
    case 'help' :
        commands.help(responseChannel, sender);
        break;

    case 'infractions' :
        commands.getInfractions(responseChannel, sender, mentionedMembers);
        break;

    case 'kick' :
        commands.kick(responseChannel, sender, mentionedMembers, discordConfig.roles.gov);
        break;

    case 'infract' :
    case 'report' :
        commands.report(responseChannel, sender, mentionedMembers, discordConfig.roles.gov, args);
        break;

    case 'exile' :
        commands.exile(responseChannel, sender, mentionedMembers, discordConfig.roles.gov, helper.parseTime(message.content));
        break;

    case 'softkick' :
        commands.softkick(responseChannel, sender, mentionedMembers, discordConfig.roles.gov);
        break;

    case 'pardon' :
        commands.pardon(responseChannel, sender, mentionedMembers, discordConfig.roles.leader);
        break;

    case 'promote' :
        commands.promote(responseChannel, sender, mentionedMembers, discordConfig.roles.gov);
        break;

    case 'demote' :
        commands.demote(responseChannel, sender, mentionedMembers, discordConfig.roles.gov);
        break;

    case 'comfort' :
        commands.comfort(responseChannel, sender, mentionedMembers, discordConfig.roles.leader);
        break;

    // TESTING ONLY
    case 'unarrive' : 
        commands.unarrive(responseChannel, sender, mentionedMembers, discordConfig.roles.gov);
        break;

    case 'anthem':
    case 'sing':
    case 'play':
        commands.play(responseChannel, sender, message.content, discordConfig.roles.gov);
        break;

    case 'banword':
    case 'banwords':
    case 'bannedwords':
        censorship.banWords(responseChannel, sender, args, discordConfig.roles.gov);
        break;

    case 'allowword':
    case 'allowwords':
    case 'unbanword':
    case 'unbanwords':
        censorship.allowWords(responseChannel, sender, args, discordConfig.roles.gov);
        break;

    case 'enablecensorship':
        censorship.enable(responseChannel, sender, true, discordConfig.roles.leader);
        break;
    
    case 'disablecensorship':
        censorship.enable(responseChannel, sender, false, discordConfig.roles.leader);
        break;

    case 'register':
        commands.registerVoter(responseChannel, sender);
        break;

    case 'holdvote':
        commands.holdVote(responseChannel, sender, mentionedMembers, message.content, discordConfig.roles.leader);
        break;
        
    // Needs more work for it to be useful
    // case 'whisper':
    //     commands.whisper(responseChannel, sender, mentionedMembers, message.content, discordConfig.roles.leader);
    //     break;

    case 'wallet':
    case 'balance':
    case 'cash':
    case 'bank':
    case 'money':
    case 'currency':
        commands.getCurrency(sender);
        break;

    // case 'addmoney':
    // case 'createmoney':
    //     commands.addCurrency(responseChannel, sender, mentionedMembers, discordConfig.roles.gov, args)
    //     break;

    case 'autodelete':
        commands.setAutoDelete(responseChannel, sender, args, discordConfig.roles.leader);
        break;

    default:
        if(responseChannel) {
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
	let matches = mention.match(/<@!?(\d+)>/);

	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) {
        return;
    }

	// However the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	let id = matches[1];

	return client.users.get(id);
}