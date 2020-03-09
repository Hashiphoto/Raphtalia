const links = require('./resources/links.json');
const helper = require('./helper.js');
const db = require('./db.js');
const welcomeQuestions = require('./resources/welcome-questions.json');
const Discord = require('discord.js');

/**
 * Very unhelpful at the moment
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 */
function help(channel, sender) {
    channel.send(`Help yourself, ${sender}`);
}

/**
 * Reports the number of infractions for a list of guildMembers. Pass in an empty array
 * for targets or leave it as null to report the sender's infractions instead
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - Whoever issued the command
 * @param {Discord.GuildMember[]} targets An array of guildMember objects to get the infractions for
 */
function getInfractions(channel, sender, targets) {
    if(targets == null || targets.length === 0) {
        helper.reportInfractions(sender, channel);
    }
    else {
        helper.reportInfractions(targets[0], channel);
    }
}

/**
 * Kick members and send them off with a nice wave and gif
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to kick
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function kick(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        target.kick()
        .then((member) => {           
            let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
            let kickGif = links.gifs.kicks[randInt];
            channel.send(`:wave: ${member.displayName} has been kicked\n${kickGif}`);
        })
        .catch((e) => {
            channel.send('Something went wrong...');
            console.error(e);
        })
    })
}

/**
 * Increase the infraction count for the list of targets
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to increase the infraction count for
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function report(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        helper.infract(target, channel, 'Yes sir~!');
    })
}

/**
 * Remove all hoisted roles from the targets and give the exile role
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to exile
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function exile(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        helper.exile(target, channel);
    })
}

/**
 * Send all the targets an invite and kick them
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to softkick
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function softkick(channel, sender, targets, permissionLevel, reason = '') {
    if(sender != null && !helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        // Create an invite with 1 usage, no expieration date
        channel.createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
        .then(invite => {
            return target.send(reason + invite.toString());
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
    })
}

/**
 * Remove all roles from targets who have the exile role
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to pardon
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function pardon(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        helper.pardon(target, channel);
    })
}


/**
 * Remove all hoisted roles from each target and increases their former highest role by one
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to promote
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function promote(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        // Disallow self-promotion
        if(sender.id === target.id) {
            helper.infract(sender, channel, links.gifs.bernieNo);
            return;
        }

        let nextHighest = helper.getNextRole(target, channel.guild);

        if(nextHighest == null) {
            channel.send(`${target} holds the highest office already`);
            return;
        }

        // Ensure the target's next highest role is not higher than the sender's
        if(sender.highestRole.comparePositionTo(nextHighest) < 0) {
            helper.infract(sender, channel, 'You can\'t promote above your own role');
            return;
        }

        // promote the target
        helper.setRoles(target, channel, [nextHighest.name]);
        channel.send(`${target} has been promoted to ${nextHighest.name}!`);
    })
}

/**
 * Remove all hoisted roles from each target and decreases their former highest role by one
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to demote
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function demote(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        // Ensure the sender has a higher rank than the target
        if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
            helper.infract(sender, channel, `${target} holds a higher rank than you!!!`);
            return;
        }

        let nextLowest = helper.getPreviousRole(target, channel.guild);

        if(nextLowest == null) {
            channel.send(`${target} can't get any lower`);
            return;
        }

        // promote the target
        helper.setRoles(target, channel, [nextLowest.name]);
        let roleName = nextLowest.name;
        if(roleName === '@everyone') {
            roleName = 'commoner';
        }
        channel.send(`${target} has been demoted to ${roleName}!`);
    })
}

/**
 * Send some love to the targets
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to headpat
 * @param {String} permissionLevel - The string name of the minimum hoisted role to use this command
 */
function comfort(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((member) => {
        channel.send(member.toString() + ' headpat');
    })
}

/**
 * Send a message and wait for the first matching response. If no responses are recieved within the timeout, 
 * a 'time' exception is thrown
 * 
 * @param {Discord.TextChannel} channel - The channel to send the message and listen for responses
 * @param {Discord.GuildMember} member - The only guildMember to listen for responses
 * @param {Object} qItem - The question and answer object
 * @param {String} qItem.question - The question to ask
 * @param {String} qItem.answer - The accepted answer that will be accepted on a RegEx match (case insensitive)
 * @param {number} qItem.timeout - The timeout in milliseconds before a 'time' exception is thrown
 * @returns {Promise<Discord.Collection<String, Discord.Message>>} On fulfilled, returns a collection of messages received
 */
function sendTimedMessage(channel, member, qItem) {
    const filter = function(message) {
        var re = new RegExp(qItem.answer, 'gi');
        return message.content.match(re) != null && message.author.id === member.id;
    };
    return channel.send(`\`(${qItem.timeout / 1000}s)\`\n${qItem.question}`)
    .then(() => {
        // Get the first message that matches the filter. Errors out if the time limit is reached
        return channel.awaitMessages(filter, { maxMatches: 1, time: qItem.timeout, errors: ['time'] });
    })
}

/**
 * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry, 
 * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
 * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge). 
 * If they do, they are made a comrade. If they don't, they are softkicked
 * 
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} member - The guildMember that is being onboarded
 */
async function arrive(channel, member) {
    let paper = await db.papers.get(member.id);
    if(paper == null) {
        channel.send(`Welcome ${member} to ${channel.guild.name}!\n` + 
        `I just have a few questions for you, and then you can enjoy go beautiful community with your fellow comrades.`);
        paper = { 'id': member.id, 'isLoyal': false, 'needsNickname': true };
        db.papers.insert(paper);
    }

    await helper.setRoles(member, channel, [ 'immigrant' ]);

    if(paper.needsNickname) {
        try{
            let collected = await sendTimedMessage(channel, member, welcomeQuestions.nickname);
            let nickname = collected.first().content;
            channel.send(`${member} will be known as ${nickname}!`);
            member.setNickname(nickname)
            .catch((e) => {
                console.error(e);
                channel.send(`Sorry. I don't have permissions to set your nickname...`);
            })
        }
        catch(e) {
            channel.send(`${member} doesn't want a nickname...`);
        }
        finally {
            paper.needsNickname = false;
            db.papers.createOrUpdate(member.id, paper);
        }
    }
    if(!paper.isLoyal) {
        try {
            await sendTimedMessage(channel, member, welcomeQuestions.loyalty);
            paper.isLoyal = true;
            db.papers.createOrUpdate(member.id, paper);
            channel.send(`Thank you! And welcome loyal comrade to ${channel.guild.name}!`)
            .then(() => {
                helper.setRoles(member, channel, [ 'comrade' ]);
            })
        }
        catch(e) {
            softkick(channel, null, [ member ], '', 'Come join the Gulag when you\'re feeling more agreeable.\n');
        }
    }
    else {
        channel.send(`Welcome back comrade ${member}!`)
        helper.setRoles(member, channel, [ 'comrade' ]);
    }
}

/**
 * TESTING ONLY - Removes the papers db entry for the target. If no target is given,
 * it deletes the sender's db entry
 * 
 * @param {Discord.Channeel} channel 
 * @param {Discord.GuildMember} sender 
 * @param {Discord.GuildMember[]} targets 
 */
function unarrive(channel, sender, targets) {
    let target = sender;
    if(targets.length > 0) {   
        target = targets[0];
    }
    db.papers.delete(target.id)
    .then(() => {
        return target.roles.forEach((role) => {
            target.removeRole(role);
        })
    })
    .then(() => {
        return channel.send(`${target}'s papers have been deleted from record`);
    })
}

module.exports = {
    help,
    getInfractions,
    kick,
    report,
    exile,
    softkick,
    pardon,
    promote,
    demote,
    comfort,

    arrive,
    unarrive
}