const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();
const prefix = '!';

// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});

// Login to Discord with your app's token
client.login(config.token);

client.on('message', message => {
    // Only respond to "!" messages
    if(!message.content.startsWith(prefix) || message.author.bot) {
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
            console.log(args[i]);
            const user = getUserFromMention(args[i]);
            if(!user) {
                continue;
            }
            var member = message.guild.members.get(user.id);
            console.log(member.displayName);
            member.kick().then((member) => {
                message.channel.send(":wave: " + member.displayName + " has been kicked");
            }).catch(() => {
                message.channel.send("I don't have to listen to you");
            })
        }
    }
})

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
    console.log(matches[1]);

	return client.users.get(id);
}

client.on("disconnect", function(event) {
    console.log('Bot disconnecting');
    process.exit();
});
