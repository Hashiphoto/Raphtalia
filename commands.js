// Node libraries
const Discord = require('discord.js');

// Files
const links = require('./resources/links.json');
const helper = require('./helper.js');
const db = require('./db.js');
const welcomeQuestions = require('./resources/welcome-questions.json');
const youtube = require('./youtube.js');
const censorship = require('./censorship.js');
const discordConfig = require('./config/discord.json')[process.env.NODE_ENV || 'dev'];

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
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function kick(channel, sender, targets, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is getting the boot');
        return;
    }

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
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function report(channel, sender, targets, allowedRole, args = null) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is being reported');
        return;
    }

    let relative = true;
    let amount = 1;

    for(let i = 0; i < args.length; i++) {
        // Check for relative set (e.g. +1)
        let relMatches = args[i].match(/^(\+|-)\d+$/g);
        if(relMatches) { 
            amount = parseInt(relMatches[0]);
            relative = true;
            break;
        }
        // Check for absolute set (e.g. 1)
        let absMatches = args[i].match(/^\d+$/g);
        if(absMatches) {
            amount = parseInt(absMatches[0]);
            relative = false;
            break;
        }
    }

    targets.forEach((target) => {
        if(relative) {
            helper.addInfractions(target, channel, amount, 'Yes sir~!');
        }
        else {
            helper.setInfractions(target, channel, amount, 'Yes sir~!');
        }
    })
    
}

/**
 * Remove all hoisted roles from the targets and give the exile role
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to exile
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 * @param {dayjs} releaseDate - The time when the exile will end
 */
function exile(channel, sender, targets, allowedRole, releaseDate) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is being exiled');
        return;
    }

    targets.forEach((target) => {
        helper.exile(target, channel, releaseDate);
    })
}

/**
 * Send all the targets an invite and kick them
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to softkick
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function softkick(channel, sender, targets, allowedRole, reason = '') {
    if(sender != null && !helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is being gently kicked');
        return;
    }

    targets.forEach((target) => {
        helper.softkick(channel, target, reason);
    })
}

/**
 * Remove all roles from targets who have the exile role
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to pardon
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function pardon(channel, sender, targets, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is being pardoned');
        return;
    }

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
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function promote(channel, sender, targets, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is being promoted');
        return;
    }

    targets.forEach((target) => {
        helper.promote(channel, sender, target);
    })
}

/**
 * Remove all hoisted roles from each target and decreases their former highest role by one
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to demote
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function demote(channel, sender, targets, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who is being demoted');
        return;
    }

    targets.forEach((target) => {
        helper.demote(channel, sender, target);
    })
}

/**
 * Send some love to the targets
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {Discord.GuildMember[]} targets - An array of guildMembers to headpat
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function comfort(channel, sender, targets, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        channel.send('Please repeat the command and specify who I\'m headpatting');
        return;
    }

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
 * @param {Object} question - The question and answer object
 * @param {String} question.prompt - The question to ask
 * @param {String} question.answer - The accepted answer that will be accepted on a RegEx match (case insensitive)
 * @param {number} question.timeout - The timeout in milliseconds before a 'time' exception is thrown
 * @returns {Promise<Discord.Collection<String, Discord.Message>>} On fulfilled, returns a collection of messages received
 */
function sendTimedMessage(channel, member, question) {
    const filter = function(message) {
        var re = new RegExp(question.answer, 'gi');
        return message.content.match(re) != null && message.author.id === member.id;
    };
    return channel.send(`\`(${question.timeout / 1000}s)\`\n${question.prompt}`)
    .then(() => {
        // Get the first message that matches the filter. Errors out if the time limit is reached
        return channel.awaitMessages(filter, { maxMatches: 1, time: question.timeout, errors: ['time'] });
    })
    .then(collected => {
        return collected.first().content;
    })
}

/**
 * Sends the timed message, but also kicks them if they answer incorrectly or include a censored word
 * @param {} question 
 */
async function askGateQuestion(channel, member, question) {
    try {
        // For strict questions, always take the first answer
        let answerRe = new RegExp(question.answer, 'gi');
        if(question.strict) {
            question.answer = '.*';
        }

        let response = await sendTimedMessage(channel, member, question);
        if(censorship.containsBannedWords(response)) {
            helper.softkick(channel, member, 'We don\'t allow those words here');
            return;
        }

        // For strict questions, kick them if they answer wrong
        if(question.strict && response.match(answerRe) == null) {
            throw new Error('Incorrect response given');
        }
        return true;
    }
    catch(e) {
        helper.softkick(channel, member, 'Come join the Gulag when you\'re feeling more agreeable.');
        return false;
    }
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
    await helper.setRoles(member, [ discordConfig.roles.immigrant ]);

    let dbUser = await db.users.get(member.id);
    
    // Check if already a citizen
    if(dbUser.citizenship) {
        channel.send(`Welcome back comrade ${member}!`)
        helper.setRoles(member, [ discordConfig.roles.neutral ]);
        return;
    }

    channel.send(`Welcome ${member} to ${channel.guild.name}!\n` + 
    `I just have a few questions for you, and then you can enjoy go beautiful community with your fellow comrades.`);

    // Set nickname
    try{
        let nickname = await sendTimedMessage(channel, member, welcomeQuestions.nickname);
        if(censorship.containsBannedWords(nickname)) {
            helper.softkick(channel, member, 'We don\'t those words around these parts. Try again');
            return;
        }
        channel.send(`${member.displayName} will be known as ${nickname}!`);
        member.setNickname(nickname)
        .catch((e) => {
            console.error(e);
            channel.send(`Sorry. I don't have permissions to set your nickname...`);
        })
    }
    catch(e) {
        channel.send(`${member} doesn't want a nickname...`);
    }

    for(let i = 0; i < welcomeQuestions.gulagQuestions.length; i++) {
        let answeredCorrect = await askGateQuestion(channel, member, welcomeQuestions.gulagQuestions[i]);
        if(!answeredCorrect) {
            return;
        }
    }

    // Creates the user in the DB if they didn't exist
    db.users.setCitizenship(member.id, true);
    channel.send(`Thank you! And welcome loyal comrade to ${channel.guild.name}! 🎉🎉🎉`)
    .then(() => {
        helper.setRoles(member, [ discordConfig.roles.neutral ]);
    })
}

/**
 * TESTING ONLY - Removes the papers db entry for the target. If no target is given,
 * it deletes the sender's db entry
 * 
 * @param {Discord.TextChannel} channel 
 * @param {Discord.GuildMember} sender 
 * @param {Discord.GuildMember[]} targets 
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command
 */
function unarrive(channel, sender, targets, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    let target = sender;
    if(targets.length > 0) {   
        target = targets[0];
    }
    return db.users.setCitizenship(target.id, false)
    .then(() => {
        return target.roles.forEach((role) => {
            target.removeRole(role);
        })
    })
    .then(() => {
        return channel.send(`${target}'s papers have been deleted from record`);
    })
}

/**
 * Play the Soviet Anthem in a voice channel
 * 
 * @param {Discord.TextChannel} channel - The channel to send replies to
 * @param {Discord.GuildMember} sender - The guildMember who issued the command
 * @param {String[]} content - The text to parse for args. Can contain a float for volume and the phrase "in [channel name]" to specify 
 * in which voice channel to play, by name.
 * @param {RoleResolvable} allowedRole - The minimum hoisted role the sender must have to use this command in another voice channel
 */
function play(channel, sender, content, allowedRole) {
    let voiceChannel = null;
    let volume = 0.5;
    // Remove the command
    content = content.replace(/!\w+/, '');

    // Check if volume was specified
    let volRegex = /\b\d+(\.\d*)?v/;
    let volMatches = content.match(volRegex);
    if(volMatches != null) {
        volume = parseFloat(volMatches[0]);
        // Remove the volume from the string
        content = content.replace(volRegex, '');
    }

    // Check if channel was specified
    let firstMatch = null;
    let secondMatch = null;
    let matches = content.match(/\bin [\w ]+/); // Everything from the "in " until the first slash (/)
    if(matches != null) {
        // Parameters are restricted permission
        if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

        firstMatch = matches[0].slice(3).trim(); // remove the "in "
        matches = content.match(/\/[\w ]+/); // Everything after the first slash (/), if it exists
        
        // The first match is the category and the second match is the channel name
        if(matches != null) {
            // remove the "in "
            secondMatch = matches[0].slice(1).trim();
            voiceChannel = channel.guild.channels.find(channel => 
                channel.type == 'voice' && 
                channel.name.toLowerCase() === secondMatch.toLowerCase() && 
                channel.parent && 
                channel.parent.name.toLowerCase() === firstMatch.toLowerCase());
            if(voiceChannel == null) {
                channel.send('I couldn\'t find a voice channel by that name');
                return;
            }
        }

        // If there is second parameter, then firstMatch is the voice channel name
        else {
            voiceChannel = channel.guild.channels.find(channel => 
                channel.type == 'voice' && 
                channel.name.toLowerCase() === firstMatch.toLowerCase());
            if(voiceChannel == null) {
                channel.send('I couldn\'t find a voice channel by that name');
                return;
            }
        }
    }

    // If no voice channel was specified, play the song in the vc the sender is in
    if(voiceChannel == null) {
        voiceChannel = sender.voiceChannel;
    
        if(!voiceChannel) {
            return channel.send('Join a voice channel first, comrade!');
        }
    }
    youtube.play(voiceChannel, links.youtube.anthem, volume);
}

function registerVoter(channel, sender) {
    helper.addRoles(sender, [ discordConfig.roles.voter ])
    .then(() => {
        channel.send(`You are now a registered voter!`);
    })
    .catch(() => {
        channel.send(`You are already registered, dingus`);
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
    unarrive,
    play,
    registerVoter
}