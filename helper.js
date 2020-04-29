// Node libraries
const Discord = require('discord.js');
const dayjs = require('dayjs');

// Files
const db = require('./db.js');
const links = require('./resources/links.json');
const discordConfig = require('./config/discord.json')[process.env.NODE_ENV || 'dev'];

// Objects
const infractionLimit = 3;
const dateFormat = 'h:mm A on MMM D, YYYY';
// This will keep track of which process id is tracking the exile release timer for each
// exile. The Key is the DiscordID and the Value is the object returned by SetTimeout()
var exileTimers = new Map();

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
 * Like hasRoleOrHigher, but infracts the member if they don't have permission
 * 
 * @param {Discord.GuildMember} member - The member to check permissions for
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {RoleResolvable} allowedRole - The hoisted role that the member must have (or higher)
 * @returns {Boolean} True if the member has high enough permission
 */
function verifyPermission(member, channel, allowedRole) {
    if(!hasRoleOrHigher(member, allowedRole)) {
        addInfractions(member, channel, 1, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
        return false;
    }

    return true;
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
    db.users.incrementInfractions(member.id, member.guild.id, amount)
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
    db.users.setInfractions(member.id, member.guild.id, amount)
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
    return db.users.get(member.id, member.guild.id)
    .then((user) => {
        let reply;
        if(user.infractions === 0) {
            reply = `${discordName} has no recorded infractions`;
        }
        else {
            reply = `${pretext}${discordName} has incurred ${user.infractions} infractions`;
        }
        if(channel) channel.watchSend(reply);

        return user.infractions;
    })
}

/**
 * If the member is an exile, remove all hoisted roles from them. If they are not an exile, nothing happens
 * 
 * @param {Discord.GuildMember} member - The guildMember to pardon
 * @param {Discord.TextChannel} channel - The channel to send messages in
 */
function pardon(member, channel) {
    db.users.setInfractions(member.id, member.guild.id, 0);

    if(hasRole(member, discordConfig.roles.exile)) {
        clearExileTimer(member);
        setHoistedRole(member, discordConfig.roles.neutral);
        if(channel) channel.watchSend(`${member} has been released from exile`);
    }
    else {
        if(channel) channel.watchSend(`${member} has been cleared of all charges`);
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
    setHoistedRole(member, discordConfig.roles.exile);
    let message = '';
    if(releaseDate != null) {
        let duration = releaseDate.diff(dayjs());
        if(duration > 0x7FFFFFFF) {
            duration = 0x7FFFFFFF;
            releaseDate = dayjs().add(duration, 'ms');
        }
        let timerId = setTimeout(() => { pardon(member, channel) }, duration);
        clearExileTimer(member);
        exileTimers.set(member.id, timerId);
        message = `\nYou will be released at ${releaseDate.format(dateFormat)}`;
    }
    else {
        message = `\nYou will be held indefinitely! May the Supreme Dictator have mercy on you.`;
    }
    if(channel) channel.watchSend(`Uh oh, gulag for you ${member}${message}\n\nAny infractions while in exile will result in expulsion`);
}

/**
 * 
 * @param {Discord.GuildMember} member - The member to clear exile timer for, if it exists
 */
function clearExileTimer(member) {
    if(exileTimers.has(member.id)) {
        clearTimeout(exileTimers.get(member.id));
        exileTimers.delete(member.id);
    }
}

/**
 * Check if a member has a given role specified by role id
 * 
 * @param {Discord.GuildMember} member - The guildMember to check roles
 * @param {RoleResolvable} role - The id of the role to check that member has
 * @returns {Boolean} - True if the member has that role
 */
function hasRole(member, role) {
    role = convertToRole(member.guild, role);
    return member.roles.get(role.id);
}

/**
 * Verify that a member has the given role or higher. Ignores non-hoisted roles
 * 
 * @param {*} member 
 * @param {*} role 
 */
function hasRoleOrHigher(member, role) {
    role = convertToRole(member.guild, role);
    return member.highestRole.comparePositionTo(role) >= 0;
}

/**
 * Set the roles of a guildMember. All hoisted roles are removed first
 * 
 * @param {Discord.GuildMember} member - The member to set the roles for
 * @param {RoleResolvable[]} role - An array of roles representing the names of the roles to give the members
 */
async function setHoistedRole(member, role) {
    let discordRole = convertToRole(member.guild, role);

    let dbRole = await db.roles.getSingle(discordRole.id);
    if(dbRole.member_limit >= 0 && discordRole.members.size >= dbRole.member_limit) {
        return Promise.resolve([false, dbRole.member_limit]);
    }
    // Remove all hoisted roles and add the ones specified
    let hoistedRoles = member.roles.filter(role => role.hoist);
    return member.removeRoles(hoistedRoles)
    .then(() => {
        member.addRoles(discordRole);
        return [true, dbRole.member_limit];
    })
    .catch(() => {
        console.error('Could not change roles for ' + member.displayName);
        return [false, dbRole.member_limit];
    })
}

function addRoles(member, roles) {
    var discordRoles = parseRoles(member.guild, roles);

    return member.addRoles(discordRoles);
}

function parseRoles(guild, roles) {
    var discordRoles = [];
    for(var i = 0; i < roles.length; i++) {
        var roleObject = convertToRole(guild, roles[i]);
        if(!roleObject) {
            console.error('Could not find role: ' + roles[i])
            continue;
        }
        discordRoles.push(roleObject);
    }
    return discordRoles;
}

/**
 * Transforms a role name or role ID into a role. Objects that are already a role are ignored
 * @param {*} guild 
 * @param {*} roleId 
 */
function convertToRole(guild, roleResolvable) {
    // Test if it's already a role
    if(roleResolvable instanceof Discord.Role) {
        return roleResolvable;
    }

    // Test if it's an ID
    let role = guild.roles.get(roleResolvable);
    if(role != null) {
        return role;
    }

    // Test if it's a mention
    let matches = roleResolvable.match(/\d+/);
    if(matches) {
        role = guild.roles.get(matches[0]);
        if(role != null) {
            return role;
        }
    }

    // Test if it's a name
    role = guild.roles.find(r => r.name.toLowerCase() === roleResolvable.toLowerCase());
    
    return role;
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
    let endDate = dayjs();
    matches.forEach(m => {
        // Get the last character as the type (h, m, d, s)
        let timeType = m.slice(-1);
        // The length is every character before the type
        let timeLength = m.slice(0, -1);
        timePairs.push({ type: timeType, length: timeLength });
    })
    timePairs.forEach(pair => {
        endDate = endDate.add(pair.length, pair.type);
    })

    return endDate;
}

/**
 * Check if infractions is over the limit, then exile the member if so.
 * If they are already in exile, then softkick them.
 * 
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} member - The GuildMember to check infractions for
 * @param {number} count - The number of infractions accrued
 */
async function checkInfractionCount(channel, member, count = null) {
    if(count == null) {
        let user = await db.users.get(member.id, member.guild.id);
        count = user.infractions;
    }
    if(count >= infractionLimit) {
        if(hasRole(member, discordConfig.roles.exile)) {
            softkick(channel, member, `Doing something illegal while under exile? Come on back when you're feeling more agreeable.`);
        }
        else {
            demote(channel, null, member);
        }
    }
}

/**
 * 
 * @param {Discord.TextChannel} channel - The channel to send invites from and replies. If channel is null, invites are sent from the system channel
 * @param {Discord.GuildMember} target - The member to softkick
 * @param {String} reason - The message to send to the kicked member 
 */
function softkick(channel, target, reason) {
    let inviteChannel = channel;
    if(!channel) {
        inviteChannel = target.guild.systemChannel;
    }
    inviteChannel.createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
    .then(invite => {
        return target.send(reason + '\n' + invite.toString());
    })
    .then(() => {
        return target.kick();
    })
    .then((member) => {
        let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
        let kickGif = links.gifs.kicks[randInt];
        if(channel) return channel.watchSend(`:wave: ${member.displayName} has been kicked and invited back\n${kickGif}`);
    })
    .catch((e) => {
        console.error(e);
        if(channel) channel.watchSend('Something went wrong...');
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
    let nextHighest = getNextRole(target, target.guild);

    // Disallow self-promotion
    if(sender != null) {
        if(sender.id === target.id) {
            addInfractions(sender, channel, 1, links.gifs.bernieNo);
            return;
        }
        // Ensure the target's next highest role is not higher than the sender's
        if(sender.highestRole.comparePositionTo(nextHighest) < 0) {
            addInfractions(sender, channel, 1, 'You can\'t promote above your own role');
            return;
        }
    }

    if(hasRole(target, discordConfig.roles.exile)) {
        clearExileTimer(target);
    }

    if(nextHighest == null) {
        if(channel) channel.watchSend(`${target} holds the highest office already`);
        return;
    }
    
    setInfractions(target, null, 0, null);

    // promote the target
    setHoistedRole(target, nextHighest)
    .then(([roleChanged, memberLimit]) => {
        if(roleChanged) {
            channel.watchSend(`${target} has been promoted to ${nextHighest.name}!`);
        }
        else {
            channel.watchSend(`Cannot promote because ${nextHighest.name} already has ${nextHighest.members.size}/${memberLimit} members!`);
        }
    })
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
    if(sender != null) {
        if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
            addInfractions(sender, channel, 1, `${target} holds a higher rank than you!!!`);
            return;
        }
        if(sender.id !== target.id && sender.highestRole.comparePositionTo(target.highestRole) == 0) {
            addInfractions(sender, channel, 1, `${target} holds an equal rank with you`);
            return;
        }
    }

    if(hasRole(target, discordConfig.roles.exile)) {
        clearExileTimer(target);
    }
    
    let nextLowest = getPreviousRole(target, target.guild);

    if(nextLowest == null) {
        if(channel) channel.watchSend(`${target} can't get any lower`);
        return;
    }

    setInfractions(target, null, 0, null);

    if(nextLowest.id == discordConfig.roles.exile) {
        exile(target, channel, dayjs().add(1, 'day'));
        return;
    }

    // demote the target
    setHoistedRole(target, nextLowest);
    let roleName = nextLowest.name;
    if(roleName === '@everyone') {
        roleName = 'commoner';
    }
    setHoistedRole(target, nextLowest)
    .then(([roleChanged, memberLimit]) => {
        if(roleChanged) {
            channel.watchSend(`${target} has been demoted to ${roleName}!`);
        }
        else {
            channel.watchSend(`Cannot demote because ${roleName} already has ${nextLowest.members.size}/${memberLimit} members!`);
        }
    })
}

/**
 * Print out the number of infractions a member has incurred in the given channel
 * 
 * @param {Discord.GuildMember} member - The member whose fractions are reported
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {String} pretext - Text to prepend at the beginning of the infraction message
 */
function reportCurrency(member, channel) {
    return db.users.get(member.id, member.guild.id)
    .then((user) => {
        if(!channel) {
            return user.currency;
        }
        let reply;
        if(user.currency === 0) {
            reply = `You are broke!`;
        }
        else if(user.currency < 0) {
            reply = `You are $${user.currency.toFixed(2)} in debt`;
        }
        else {
            reply = `You have $${user.currency.toFixed(2)}`;
        }
        if(channel.type === 'dm') {
            reply += ` in ${member.guild.name}`
        }
        channel.send(reply);

        return user.currency;
    })
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
function addCurrency(member, amount = 1) {
    return db.users.incrementCurrency(member.id, member.guild.id, amount)
}

function getLeaderRole(guild) {
    return guild.roles.filter(role => role.hoist && role.members.size > 0).sort((a,b) => b.calculatedPosition - a.calculatedPosition).first();
}

function getUserIncome(member) {
    return db.users.get(member.id, member.guild.id)
    .then(dbUser => {
        // Check for personally-set income
        let bonusIncome = 0;
        if(dbUser.bonus_income != 0) {
            bonusIncome = dbUser.bonus_income;
        }
        // Check for role income
        if(!member.hoistRole) { return bonusIncome }
        return db.roles.getSingle(member.hoistRole.id)
        .then(dbRole => {
            if(!dbRole) { return bonusIncome }

            return dbRole.income;
        })
    })
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
    hasRole,
    hasRoleOrHigher,
    setHoistedRole,
    addRoles,
    parseTime,
    checkInfractionCount,
    softkick,
    promote,
    demote,
    dateFormat,
    convertToRole,
    reportCurrency,
    addCurrency,
    getLeaderRole,
    getUserIncome
}