const db = require('./db.js');
const Discord = require('discord.js');
const dayjs = require('dayjs');
const infractionLimit = 5;

/**
 * Get the next highest hoisted role for a given member
 * 
 * @param {Discord.GuildMember} member - The guildMember to check the highest role for
 * @param {Discord.Guild} guild - The guild to check the roles for
 * @returns {Discord.Role} The Role object that is one higher than the member's current highest
 * in the hierarchy
 */
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

/**
 * Get the next lowest hoisted role for a given member
 * 
 * @param {Discord.GuildMember} member - The guildMember to check the lowest role for
 * @param {Discord.Guild} guild - The guild to check the roles for
 * @returns {Discord.Role} The Role object that is one lower than the member's current highest
 * in the hierarchy
 */
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

/**
 * Like hasPermission, but infracts the member if they don't have permission
 * 
 * @param {Discord.GuildMember} member - The member to check permissions for
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} minRoleName - The name of the role that the member must have (or higher)
 * @returns {Boolean} True if the member has high enough permission
 */
function verifyPermission(member, channel, minRoleName) {
    if(!hasPermission(member, minRoleName)) {
        infract(member, channel, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
        return false;
    }

    return true;
}

/**
 * Verifies that the member has a role equal to or greater than the role given by minRoleName
 * 
 * @param {Discord.GuildMember} member - The member to check 
 * @param {String} minRoleName - The name of the role that the member must have (or higher)
 * @returns {Boolean} True if the member has high enough permission
 */
function hasPermission(member, minRoleName) {
    var minRole = member.guild.roles.find(role => role.name.toLowerCase() === minRoleName.toLowerCase());
    if(!minRole) {
        console.log('There is no role \"' + minRoleName + '\". Go check the permissions file');
        return false;
    }

    return member.highestRole.comparePositionTo(minRole) >= 0;
}

/**
 * Increases the infraction count for a given member. If they exceed the infractionLimit, the member
 * is exiled
 * 
 * @param {Discord.GuildMember} member - The member to infract
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
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

/**
 * Set the absolute infraction count for a given member
 * 
 * @param {Discord.GuildMember} member - The member to set the infractions for
 * @param {number} amount - The number of infractions they will have
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
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

/**
 * Print out the number of infractions a member has incurred in the given channel
 * 
 * @param {Discord.GuildMember} member - The member whose fractions are reported
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} pretext - Text to prepend at the beginning of the infraction message
 */
function reportInfractions(member, channel, pretext = '') {
    const discordName = member.toString();
    return db.infractions.get(member.id)
    .then((count) => {
        let reply;
        if(count === 0) {
            reply = `${discordName} is a model citizen ♥`;
        }
        else {
            reply = `${pretext}${discordName} has incurred ${count} infractions`;
        }
        channel.send(reply);

        return count;
    })
}

/**
 * If the member is an exile, remove all hoisted roles from them. If they are not an exile, nothing happens
 * 
 * @param {Discord.GuildMember} member - The guildMember to pardon
 * @param {Discord.TextChannel} channel - The channel to send messages in
 */
function pardon(member, channel) {
    if(!hasRole(member, 'exile')) {
        return;
    }
    db.infractions.set(member.id, 0);
    // Clear all roles
    setRoles(member, channel, []);
    channel.send(`${member} has been released from exile`);
}

/**
 * Remove all hoisted roles and give the member the exile role
 * 
 * @param {Discord.GuildMember} member - The guildMember to exile
 * @param {Discord.TextChannel} channel - The channel to send messages in
 */
function exile(member, channel, releaseDate = null) {
    setRoles(member, channel, ['exile']);
    let message = '';
    if(releaseDate != null) {
        let duration = releaseDate.diff(dayjs());
        if(duration > 0x7FFFFFFF) {
            duration = 0x7FFFFFFF;
            releaseDate = dayjs().add(duration, 'ms');
        }
        setTimeout(() => { pardon(member, channel) }, duration);
        message = `\nYou will be released at ${releaseDate.format('h:mm A on MMM D, YYYY')}`;
    }
    channel.send(`Uh oh, gulag for you ${member}${message}`);
}

/**
 * Check if a member has a given role
 * 
 * @param {Discord.GuildMember} member - The guildMember to check roles
 * @param {String} roleName - The name of the role to check that member has
 */
function hasRole(member, roleName) {
    return member.roles.find(role => role.name.toLowerCase() === roleName.toLowerCase());
}

/**
 * Set the roles of a guildMember. All hoisted roles are removed first
 * 
 * @param {Discord.GuildMember} member - The member to set the roles for
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String[]} roles - An array of strings representing the names of the roles to give the members
 */
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

    // Remove all hoisted roles and add the ones specified
    return member.removeRoles(member.roles.filter(role => role.hoist))
    .then(() => {
        return member.addRoles(discordRoles)
    })
    .catch(() => {
        console.error('Could not remove roles for ' + member.toString());
    })
}

/**
 * Add a specified amount of time to the current time and return a dayjs date that equals
 * the sum of the current time and the parameter "duration"
 * 
 * @param {String} duration - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
 * @returns {dayjs} The current time + the duration passed in
 */
function parseTime(duration) {
    let matches = duration.match(/\d+[dhms]/g);
    let timePairs = [];
    let releaseDate = dayjs();
    matches.forEach(m => {
        // Get the last character as the type (h, m, d, s)
        let timeType = m.slice(-1);
        // The length is every character before the type
        let timeLength = m.slice(0, -1);
        timePairs.push({ type: timeType, length: timeLength });
    })
    timePairs.forEach(pair => {
        releaseDate = releaseDate.add(pair.length, pair.type);
    })

    return releaseDate;
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
    hasRole,
    setRoles,
    parseTime
}