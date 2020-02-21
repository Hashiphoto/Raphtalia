const Discord = require('discord.js');
const Sequelize = require('sequelize');
var discordConfig;
const permissions = require('./permissions.json');
const connection = require('./config/db-config.json');
const links = require('./links.json');
const client = new Discord.Client();
var sequelize = new Sequelize('mysql://'+connection.user+':'+connection.password+'@localhost:3306/raphtalia');
var infractions = sequelize.import('./sequelize_models/infractions.js');

const prefix = '!';
const everyoneRole = '@everyone';
const infractionLimit = 5;

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
    var sender = message.guild.members.get(message.author.id);

    switch(command){
    case 'help' :
        message.channel.send('Help yourself, ' + message.member.toString());
        break;
    case 'infractions' :
        if(message.mentions.users.size === 0) {
            reportInfractions(sender, message.channel);
        }
        break;
    case 'kick' :
        if(!verifyPermission(sender, message.channel, permissions.kick)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            target.kick().then((member) => {
                message.channel.send(':wave: ' + member.displayName + ' has been kicked')
                .then(() => {
                    let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
                    let showkick = links.gifs.kicks[randInt];
                    message.channel.send(showkick);
                })
            }).catch(() => {
                message.channel.send('Something went wrong...');
            })
        })
        break;
    case 'report' :
        if(!verifyPermission(sender, message.channel, permissions.report)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            infract(target.id, message.channel, 'Yes sir~!');
        })
        break;
    case 'exile' :
        if(!verifyPermission(sender, message.channel, permissions.exile)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            exile(target.id, message.channel);
        })
        break;
    case 'softkick' :
        if(!verifyPermission(sender, message.channel, permissions.kick)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            message.channel.createInvite({temporary: true, maxAge: 300, maxUses: 1, unique: true})
            .then(invite => {
                target.send(invite.toString())
                .then(() => {
                    target.kick().then((member) => {
                        message.channel.send(':wave: ' + member.displayName + ' has been kicked and invited back')
                        .then(() => {
                            message.channel.send(links.gifs.softkick);
                        })
                    }).catch(() => {
                        message.channel.send('Something went wrong...');
                    })
                })
            })

        })
        break;
    case 'pardon' :
        if(!verifyPermission(sender, message.channel, permissions.pardon)) {
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            pardon(target.id, message.channel);
        })
        break;
    case 'promote' :
        if(!verifyPermission(sender, message.channel, permissions.promote)) {
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            // Disallow self-promotion
            if(sender.id === target.id) {
                infract(sender.id, message.channel, links.gifs.bernieNo);
                return;
            }

            var nextHighest = getNextRole(target, message.guild);

            if(nextHighest == null) {
                message.channel.send(target.toString() + ' holds the highest office already');
                return;
            }

            // Ensure the target's next highest role is not higher than the sender's
            if(sender.highestRole.comparePositionTo(nextHighest) < 0) {
                infract(sender.id, message.channel, 'You can\'t promote above your own role');
                return;
            }

            // promote the target
            setRoles(target.id, message.channel, [nextHighest.name]);
            message.channel.send(target.toString() + ' has been promoted to ' + nextHighest.name + '!');
        })
        break;
    case 'demote' :
        if(!verifyPermission(sender, message.channel, permissions.promote)) {
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            // Ensure the sender has a higher rank than the target
            if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
                infract(sender.id, message.channel, target.toString() + ' holds a higher rank than you!!!');
                return;
            }

            var nextLowest = getPreviousRole(target, message.guild);

            if(nextLowest == null) {
                message.channel.send(target.toString() + ' can\'t get any lower');
                return;
            }

            // promote the target
            setRoles(target.id, message.channel, [nextLowest.name]);
            var roleName = nextLowest.name;
            if(roleName === everyoneRole) {
                roleName = 'commoner';
            }
            message.channel.send(target.toString() + ' has been demoted to ' + roleName + '!');
        })
        break;
    }
}

function getNextRole(member, guild) {
    var curRole = member.highestRole;

    // Get the next highest role
    var higherRoles = [];
    guild.roles.forEach(role => {
        if(role.comparePositionTo(curRole) > 0 && role.managed === false) {
            higherRoles.push(role);
        }
    })
    if(higherRoles.length === 0) {
        return null;
    }
    higherRoles.sort(function(role1, role2) {
        return role1.position > role2.position;
    })
    
    return higherRoles[0];
}

function getPreviousRole(member, guild) {
    var curRole = member.highestRole;

    // Get the next highest role
    var lowerRoles = [];
    guild.roles.forEach(role => {
        if(role.comparePositionTo(curRole) < 0 && role.managed === false) {
            lowerRoles.push(role);
        }
    })
    if(lowerRoles.length === 0) {
        return null;
    }
    lowerRoles.sort(function(role1, role2) {
        return role1.position < role2.position;
    })
    
    return lowerRoles[0];
}

function doForEachMention(sender, channel, args, action) {
    for(var i = 0; i < args.length; i++) {
        const user = getUserFromMention(args[i]);
        if(!user) {
            continue;
        }
        var target = channel.guild.members.get(user.id);

        if(!target) {
            console.log('Could not find that member');
            return;
        }

        if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
            infract(sender, channel, 'Targeting a superior are we?');
            return;
        }
        
        action(sender, target);
    }
}

function censor(message) {
    const sender = message.guild.members.get(message.author.id);
    const regex = /(capitalism|freedom|america)/gi;
    // simple banned words
    if(message.content.match(regex) != null) {
        const fixedMessage = 'I fixed ' + sender.toString() + '\'s message\n>>> ' + message.content.replace(regex, '██████');
        message.delete();
        message.channel.send(fixedMessage);

        infract(message.author.id, message.channel, 'This infraction has been recorded');
    }
    // supreme leader disrespect
    else if(message.content.match(/(long live|all hail|glory to)/gi) != null &&
            !message.mentions.roles.find(role => role.name === 'Supreme Dictator') &&
            message.content.match(/(gulag|supreme leader|leader|erkin|dictator|supreme dictator|bootylicious supreme dictator)/gi) == null) {
        infract(message.author.id, message.channel, 'Glory to the Supreme Dictator _alone!_ This infraction has been recorded');
    }
    // :flag_us:
    else if(message.content.includes('🇺🇸')) {
        message.delete();
        infract(message.author.id, message.channel, 'Uh, oh. ☭☭☭');
    }
}

// check if has permission and infracts the member if they don't
function verifyPermission(member, channel, minRoleName) {
    if(!hasPermission(member, minRoleName)) {
        infract(member.id, channel, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
        return false;
    }

    return true;
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

function infract(discordId, channel, reason = '') {
    sequelize.transaction(function(t) {
        return infractions.findOrCreate({
            where: {
                id: discordId
            },
            transaction: t
        }).spread(function(user, created) {
            user.increment('infractionsCount')
            .then((updatedRow) => {
                var infractionCount = updatedRow.infractionsCount;
                reportInfractions(discordId, channel, reason + '\n');
                if(infractionCount > infractionLimit) {
                    exile(discordId, channel);
                }
            })
        })
    });
}

function reportInfractions(id, channel, pretext = '') {
    const discordName = channel.guild.members.get(id).toString();
    infractions.findByPk(id)
    .then(user => {
    	channel.send(pretext + discordName + ' has incurred ' + user.infractionsCount + ' infractions');
    })
    .catch(() => {
		channel.send(discordName + ' is a model citizen <3');
    })
}

function pardon(id, channel) {
    setRoles(id, channel, []); // clear all roles
    var member = channel.guild.members.get(id);
    channel.send(member.toString() + ' has been un-exiled');
}

function exile(id, channel) {
    setRoles(id, channel, ['exile']);
    var member = channel.guild.members.get(id);
    channel.send('Uh oh, gulag for you ' + member.toString());
}

// Set the roles of a user. The parameter roles is an array of string (names of roles)
function setRoles(id, channel, roles) {
    var discordRoles = [];
    var member = channel.guild.members.get(id);

    // Get the backing roles for the names
    for(var i = 0; i < roles.length; i++) {
        var roleObject = channel.guild.roles.find(r => r.name.toLowerCase() === roles[i].toLowerCase());
        if(!roleObject) {
            console.log('Could not find role: ' + roles[i])
            continue;
        }
        discordRoles.push(roleObject);
    }
    
    // Check if user already has roles, including @everyone
    // var hasRoles = true;
    // if(member.roles.size === discordRoles.size + 1) {
    //     discordRoles.forEach(role => {
    //         if(!member.roles.has(role.id)) {
    //             hasRoles = false;
    //         }
    //     })
    // }

    // if(hasRoles) {
    //     return;
    // }

    member.removeRoles(member.roles)
    .then(() => {
        member.addRoles(discordRoles)
        .catch(() => {
            console.error('Could not add roles to ' + member.toString());
        })
    })
    .catch(() => {
        console.error('Could not remove roles for ' + member.toString());
    })
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
