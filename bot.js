const Discord = require('discord.js');
const Sequelize = require('sequelize');
const discordConfig = require('./config/discord-config.json');
const permissions = require('./permissions.json');
const connection = require('./config/db-config.json');
const client = new Discord.Client();
var sequelize = new Sequelize('mysql://'+connection.user+':'+connection.password+'@localhost:3306/raphtalia');
var infractions = sequelize.import('./sequelize_models/infractions.js');
const prefix = '!';
const infractionLimit = 5;

console.log('Connected!');
// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once('ready', () => {
    // Login to Discord with your app's token
    console.log('Ready!');
    sequelize.sync({ force: false }).then(() => {
        console.log('Database synced!');
    })
});

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
        censor(message)
    }
})

function processCommand(message) {
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    var authorMember = message.guild.members.get(message.author.id);

    if(command === 'help') {
        message.channel.send('Help yourself, ' + message.member.toString());
    }
    else if(command === 'kick') {
        if(!hasPermission(authorMember, permissions.kick)) {
            infract(message, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
            return;
        }

        // Iterate through every argument and check if it's a mention
        for(var i = 0; i < args.length; i++) {
            const user = getUserFromMention(args[i]);
            if(!user) {
                continue;
            }
            var member = message.guild.members.get(user.id);

            if(!member) {
                console.log('Could not find that member');
                return;
            }

            if(authorMember.highestRole.comparePositionTo(member.highestRole) < 0) {
                infract(message, 'Trying to kick a superior are we?');
                return;
            }

            member.kick().then((member) => {
                message.channel.send(':wave: ' + member.displayName + ' has been kicked');
            }).catch(() => {
                message.channel.send('Something went wrong...');
            })
        }
    }
    else if(command === 'infractions') {
        if(message.mentions.users.size === 0) {
            reportInfractions(message.author.id, message.channel);
        }
    }
}

function censor(message) {
    // capitalism
    if(message.content.match(/capitalism/gi) != null) {
        infract(message, 'That\'s a funny way to spell \"Communism\". This infraction has been recorded');
    }
    // supreme leader disrespect
    else if(message.content.match(/(long live|all hail|glory to)/gi) != null &&
            !message.mentions.roles.find(role => role.name === 'Supreme Dictator') &&
            message.content.match(/(gulag|supreme leader|leader|erkin|dictator|supreme dictator|bootylicious supreme dictator)/gi) == null) {
        infract(message, 'Glory to the Supreme Dictator _alone!_ This infraction has been recorded');
    }
    // :flag_us:
    else if(message.content.includes('🇺🇸')) {
        message.delete();
        infract(message, 'Uh, oh. ☭☭☭');
    }
}

// This function verifies that the member has a role equal to or greater than the role given by minRoleName
function hasPermission(member, minRoleName) {
    var minRole = member.guild.roles.find(role => role.name.toLowerCase() === minRoleName.toLowerCase());
    if(!minRole) {
        console.log('There is no role \"' + minRoleName + '\". Go check the permissions file');
        return false;
    }

    return member.highestRole.comparePositionTo(minRole) >= 0;
}

function infract(message, reason) {
    sequelize.transaction(function(t) {
        return infractions.findOrCreate({
            where: {
                id: message.author.id
            },
            transaction: t
        }).spread(function(user, created) {
            user.increment('infractionsCount')
            .then((updatedRow) => {
                var infractionCount = updatedRow.infractionsCount;
                message.channel.send(reason);
                reportInfractions(message.author.id, message.channel);
                if(infractionCount > infractionLimit) {
                    exile(message.author.id, message.channel);
                }
            })
        })
    });
}

function reportInfractions(id, channel) {
    const discordName = channel.guild.members.get(id).toString();
    infractions.findByPk(id)
    .then(user => {
    	channel.send(discordName + ' has incurred ' + user.infractionsCount + ' infractions');
    })
    .catch(() => {
		channel.send(discordName + ' is a model citizen <3');
    })
}

function exile(id, channel) {
    var member = channel.guild.members.get(id);
    member.removeRoles(member.roles, 'exiled');
    var exileRole = channel.guild.roles.find(role => role.name.toLowerCase() === 'exile');
    member.addRole(exileRole);
    channel.send('Uh oh, gulag for you ' + member.toString());
}

function getUserFromMention(mention) {
	// The id is the first and only match found by the RegEx.
	const matches = mention.match(/^<@!?(\d+)>$/);

	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) {
        return;
    }

	// However the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	const id = matches[1];

	return client.users.get(id);
}

client.on("disconnect", function(event) {
    console.log('Bot disconnecting');
    process.exit();
});
