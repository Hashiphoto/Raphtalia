// Node libraries
const Discord = require('discord.js');
const dayjs = require('dayjs');

// Files
const db = require('./db.js');
const links = require('./resources/links.json');

// Objects
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
        addInfractions(member, channel, 1, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
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
 * @param {Number} [amount] - The amount of infractions to increase by (default is 1)
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
function addInfractions(member, channel, amount = 1, reason = '') {
    db.infractions.increment(member.id, amount)
    .then(() => {
        return reportInfractions(member, channel, reason + '\n')
    })
    .then((count) => {
        checkInfractionCount(channel, member, count);
    });
}

/**
 * Set the absolute infraction count for a given member
 * 
 * @param {Discord.GuildMember} member - The member to set the infractions for
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {number} amount - The number of infractions they will have
 * @param {String} [reason] - A message to append to the end of the infraction notice
 */
function setInfractions(member, channel, amount = 1, reason = ''){
    db.infractions.set(member.id, amount)
    .then(() => {
        return reportInfractions(member,  channel, reason + '\n')
    })
    .then((count) => {
        checkInfractionCount(channel, member, count);
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
    db.infractions.set(member.id, 0);

    if(hasRole(member, 'exile')) {
        setRoles(member, channel, ['comrade']);
        channel.send(`${member} has been released from exile`);
    }
    else {
        channel.send(`${member} has been cleared of all charges`);
    }
}

/**
 * Remove all hoisted roles and give the member the exile role
 * 
 * @param {Discord.GuildMember} member - The guildMember to exile
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {dayjs} releaseDate - The dayjs object representing when the exile will end
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
    else {
        message = `\nYou will be held indefinitely! May the Supreme Dictator have mercy on you.`;
    }
    channel.send(`Uh oh, gulag for you ${member}${message}\n\nAny infractions while in exile will result in expulsion`);
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
    if(!matches) { return null }
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

/**
 * Check if infractions is over the limit, then exile the member if so.
 * If they are already in exile, then softkick them.
 * 
 * @param {number} count - The number of infractions accrued
 */
function checkInfractionCount(channel, member, count = null) {
    if(count == null) {
        count = db.infractions.get(member);
    }
    if(count >= infractionLimit) {
        if(hasRole(member, 'exile')) {
            softkick(channel, member, `Doing something illegal while under exile? Come on back when you're feeling more agreeable.`);
        }
        else {
            exile(member, channel, dayjs().add(1, 'day'));
        }
    }
}

function softkick(channel, target, reason) {
    channel.createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
    .then(invite => {
        return target.send(reason + '\n' + invite.toString());
    })
    .then(() => {
        return target.kick();
    })
    .then((member) => {
        return channel.send(`:wave: ${member.displayName} has been kicked and invited back\n${links.gifs.softkick}`);
    })
    .catch(() => {
        channel.send('Something went wrong...');
    })
}

/**
 * Remove all hoisted roles from one target and increase their former highest role by one
 * 
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} sender - The GuildMember doing the promotion
 * @param {Discord.GuildMember} target - The GuildMember being promoted
 */
function promote(channel, sender, target) {
    // Disallow self-promotion
    if(sender.id === target.id) {
        addInfractions(sender, channel, 1, links.gifs.bernieNo);
        return;
    }

    let nextHighest = getNextRole(target, channel.guild);

    if(nextHighest == null) {
        channel.send(`${target} holds the highest office already`);
        return;
    }

    // Ensure the target's next highest role is not higher than the sender's
    if(sender.highestRole.comparePositionTo(nextHighest) < 0) {
        addInfractions(sender, channel, 1, 'You can\'t promote above your own role');
        return;
    }

    // promote the target
    setRoles(target, channel, [nextHighest.name]);
    channel.send(`${target} has been promoted to ${nextHighest.name}!`);
}

/**
 * Remove all hoisted roles from one target and decrease their former highest role by one
 * 
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} sender - The GuildMember doing the promotion
 * @param {Discord.GuildMember} target - The GuildMember being promoted
 */
function demote(channel, sender, target) {
    // Ensure the sender has a higher rank than the target
    if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
        addInfractions(sender, channel, 1, `${target} holds a higher rank than you!!!`);
        return;
    }

    let nextLowest = getPreviousRole(target, channel.guild);

    if(nextLowest == null) {
        channel.send(`${target} can't get any lower`);
        return;
    }

    // promote the target
    setRoles(target, channel, [nextLowest.name]);
    let roleName = nextLowest.name;
    if(roleName === '@everyone') {
        roleName = 'commoner';
    }
    channel.send(`${target} has been demoted to ${roleName}!`);
}

module.exports = {
    getNextRole,
    getPreviousRole,
    verifyPermission,
    addInfractions,
    setInfractions,
    reportInfractions,
    pardon,
    exile,
    hasPermission,
    hasRole,
    setRoles,
    parseTime,
    checkInfractionCount,
    softkick,
    promote,
    demote
}