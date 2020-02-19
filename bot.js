const Discord = require('discord.js');
const Sequelize = require('sequelize');
const config = require('./config.json');
const permissions = require('./permissions.json');
const connection = require('./connection.json');
const client = new Discord.Client();
var sequelize = new Sequelize('mysql://'+connection.user+':'+connection.password+'@localhost:3306/raphtalia');
var infractions = sequelize.import('./sequelize_models/infractions.js');
const prefix = '!';

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

client.login(config.token).then(() => {
    console.log('Logged in!');
});

client.on('message', message => {
    if(message.author.bot) {
        return;
    }

    // capitalism
    if(message.content.match(/capitalism/gi) != null) {
        infract(message, 'That\'s a funny way to spell \"Communism\". This infraction has been recorded');
    }

    // :flag_us:
    if(message.content.includes('🇺🇸') != null) {
        message.delete();
        infract(message, '☭☭☭');
    }

    // Commands
    if(!message.content.startsWith(prefix)) {
        return;
    }
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    if(command === 'help') {
        message.channel.send('Help yourself, ' + message.member.toString());
    }
    else if(command === 'kick') {
        // Iterate through every argument and check if it's a mention
        for(var i = 0; i < args.length; i++) {
            const user = getUserFromMention(args[i]);
            if(!user) {
                continue;
            }
            var member = message.guild.members.get(user.id);
            member.kick().then((member) => {
                message.channel.send(':wave: ' + member.displayName + ' has been kicked');
            }).catch(() => {
                message.channel.send('I don\'t have to listen to you');
            })
        }
    }
    else if(command === 'infractions') {
        if(message.mentions.users.size === 0) {
            reportInfractions(message.author.id, message);
        }
    }
})

function infract(message, reason) {
    sequelize.transaction(function(t) {
        return infractions.findOrCreate({
            where: {
                id: message.author.id
            },
            transaction: t
        }).spread(function(user, created) {
            user.update({
                infractionsCount: sequelize.literal('infractionsCount + 1')
            }).then(() => {
                message.channel.send(reason);
                printInfractions(user.id, message);
            });
        })
    })
}

function printInfractions(userId, message) {
    infractions.findByPk(userId).then(user => {
        const discordName = message.guild.members.get(userId).toString();
        message.channel.send(discordName + ' has incurred ' + user.infractionsCount + ' infractions');
    });
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
