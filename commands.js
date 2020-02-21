exports.getNextRole = function(member, guild) {
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

exports.getPreviousRole = function(member, guild) {
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

exports.doForEachMention = function(sender, channel, args, action) {
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

exports.censor = function(message) {
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
exports.verifyPermission = function(member, channel, minRoleName) {
    if(!hasPermission(member, minRoleName)) {
        infract(member.id, channel, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
        return false;
    }

    return true;
}

// This function verifies that the member has a role equal to or greater than the role given by minRoleName
exports.hasPermission = function(member, minRoleName) {
    var minRole = member.guild.roles.find(role => role.name.toLowerCase() === minRoleName.toLowerCase());
    if(!minRole) {
        console.log('There is no role \"' + minRoleName + '\". Go check the permissions file');
        return false;
    }

    return member.highestRole.comparePositionTo(minRole) >= 0;
}

exports.infract = function(discordId, channel, reason = '') {
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
                reportInfractions(discordId,  channel, reason + '\n');
                if(infractionCount >= infractionLimit) {
                    exile(discordId, channel);
                }
            })
        })
    });
}

exports.setInfractions = function(discordId, amount, channel, reason){
    sequelize.transaction(function(t) {
        return infractions.findOrCreate({
            where: {
                id: discordId
            },
            transaction: t
        }).spread(function(user, created) {
            user.infractionCount = amount;
            reportInfractions(discordId, channel, reason + '\n');
            if(infractionCount >= infractionLimit) {
                exile(discordId, channel);
            }
        })
    });
}

exports.reportInfractions = function(id, channel, pretext = '') {

    const discordName = channel.guild.members.get(id).toString();
    infractions.findByPk(id)
    .then(user => {
    	channel.send(pretext + discordName + ' has incurred ' + user.infractionsCount + ' infractions');
    })
    .catch(() => {
		channel.send(discordName + ' is a model citizen <3');
    })
}

exports.pardon = function(id, channel) {
    setRoles(id, channel, []); // clear all roles
    var member = channel.guild.members.get(id);
    channel.send(member.toString() + ' has been un-exiled');
}

exports.exile = function(id, channel) {
    setRoles(id, channel, ['exile']);
    var member = channel.guild.members.get(id);
    channel.send('Uh oh, gulag for you ' + member.toString());
}

// Set the roles of a user. The parameter roles is an array of string (names of roles)
exports.setRoles = function(id, channel, roles) {
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

exports.getUserFromMention = function(mention) {
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