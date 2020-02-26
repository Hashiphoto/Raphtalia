const db = require('./db.js');
const infractionLimit = 5;

// Get the next highest role that is shown in hierarchy
function getNextRole(member, guild) {
    var curRole = member.highestRole;

    var higherRoles = [];
    guild.roles.forEach(role => {
        if(role.comparePositionTo(curRole) > 0 && !role.managed && role.hoist) {
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

// Get the next lowest role that is shown in hierarchy
function getPreviousRole(member, guild) {
    var curRole = member.highestRole;

    var lowerRoles = [];
    guild.roles.forEach(role => {
        if(role.comparePositionTo(curRole) < 0 && !role.managed && role.hoist) {
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

// check if has permission and infracts the member if they don't
function verifyPermission(member, channel, minRoleName) {
    if(!hasPermission(member, minRoleName)) {
        infract(member, channel, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
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

function infract(member, channel, reason = '') {
    db.infractions.increment(member.id)
    .then(() => {
        return reportInfractions(member,  channel, reason + '\n')
    })
    .then((infractionCount) => {
        if(infractionCount >= infractionLimit) {
            exile(member, channel);
        }
    });
}

function setInfractions(member, amount, channel, reason = ''){
    db.infractions.set(member.id)
    .then(() => {
        return reportInfractions(member,  channel, reason + '\n')
    })
    .then((infractionCount) => {
        if(infractionCount >= infractionLimit) {
            exile(member, channel);
        }
    });
}

function reportInfractions(member, channel, pretext = '') {
    const discordName = member.toString();
    return db.infractions.get(member.id)
    .then((count) => {
        let reply;
        if(count === 0) {
            reply = discordName + ' is a model citizen <3';
        }
        else {
            reply = pretext + discordName + ' has incurred ' + count + ' infractions';
        }
        channel.send(reply);
        return count;
    })
}

function pardon(member, channel) {
    setRoles(member, channel, []); // clear all roles
    channel.send(member.toString() + ' has been un-exiled');
}

function exile(member, channel) {
    setRoles(member, channel, ['exile']);
    channel.send('Uh oh, gulag for you ' + member.toString());
}

// Set the roles of a user. The parameter roles is an array of string (names of roles)
function setRoles(member, channel, roles) {
    var discordRoles = [];

    // Get the backing roles for the names
    for(var i = 0; i < roles.length; i++) {
        var roleObject = channel.guild.roles.find(r => r.name.toLowerCase() === roles[i].toLowerCase());
        if(!roleObject) {
            console.error('Could not find role: ' + roles[i])
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

    // Remove all hoisted roles and add the ones specified
    member.removeRoles(member.roles.filter(role => role.hoist))
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

module.exports = {
    getNextRole,
    getPreviousRole,
    verifyPermission,
    infract,
    setInfractions,
    reportInfractions,
    pardon,
    exile,
    hasPermission,
    setRoles
}