// Node libraries
const Discord = require('discord.js');
const dayjs = require('dayjs');

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
    if(channel) {
        if(channel) channel.watchSend(`Help yourself, ${sender}`);
    }
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
        if(channel) channel.watchSend('Please repeat the command and specify who is getting the boot');
        return;
    }

    targets.forEach((target) => {
        target.kick()
        .then((member) => {
            let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
            let kickGif = links.gifs.kicks[randInt];
            if(channel) channel.watchSend(`:wave: ${member.displayName} has been kicked\n${kickGif}`);
        })
        .catch((e) => {
            if(channel) channel.watchSend('Something went wrong...');
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
        if(channel) channel.watchSend('Please repeat the command and specify who is being reported');
        return;
    }

    let amount = 1;

    for(let i = 0; i < args.length; i++) {
        let relMatches = args[i].match(/^\+?\d+$/g);
        if(relMatches) { 
            amount = parseInt(relMatches[0]);
            break;
        }
    }

    targets.forEach((target) => {
        helper.addInfractions(target, channel, amount, 'Yes sir~!');
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
        if(channel) channel.watchSend('Please repeat the command and specify who is being exiled');
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
        if(channel) channel.watchSend('Please repeat the command and specify who is being gently kicked');
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
        if(channel) channel.watchSend('Please repeat the command and specify who is being pardoned');
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
        if(channel) 
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
        if(channel) channel.watchSend('Please repeat the command and specify who is being demoted');
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
    if(!channel) return;

    if(targets.length === 0) {
        channel.watchSend('Please repeat the command and specify who I\'m headpatting');
        return;
    }

    targets.forEach((member) => {
        channel.watchSend(member.toString() + ' headpat');
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
function sendTimedMessage(channel, member, question, showDuration = true) {
    if(!channel) return;
    const filter = function(message) {
        var re = new RegExp(question.answer, 'gi');
        return message.content.match(re) != null && message.author.id === member.id;
    };
    let text = '';
    if(showDuration) {
        text += `\`(${question.timeout / 1000}s)\`\n`;
    }
    text += question.prompt;
    return channel.watchSend(text)
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

        if(await censorship.containsBannedWords(member.guild.id, response)) {
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
    if(!channel) return;
    await helper.setRoles(member, [ discordConfig.roles.immigrant ]);

    let dbUser = await db.users.get(member.id, member.guild.id);
    
    // Check if already a citizen
    if(dbUser.citizenship) {
        channel.watchSend(`Welcome back comrade ${member}!`)
        helper.setRoles(member, [ discordConfig.roles.neutral ]);
        return;
    }

    channel.watchSend(`Welcome ${member} to ${channel.guild.name}!\n` + 
    `I just have a few questions for you, and then you can enjoy go beautiful community with your fellow comrades.`);

    // Set nickname
    try{
        let nickname = await sendTimedMessage(channel, member, welcomeQuestions.nickname);
        if(await censorship.containsBannedWords(channel.guild.id, nickname)) {
            helper.softkick(channel, member, 'We don\'t allow those words around here');
            return;
        }
        channel.watchSend(`${member.displayName} will be known as ${nickname}!`);
        member.setNickname(nickname)
        .catch((e) => {
            console.error(e);
            channel.watchSend(`Sorry. I don't have permissions to set your nickname...`);
        })
    }
    catch(e) {
        console.error(e);
        channel.watchSend(`${member} doesn't want a nickname...`);
    }

    for(let i = 0; i < welcomeQuestions.gulagQuestions.length; i++) {
        let answeredCorrect = await askGateQuestion(channel, member, welcomeQuestions.gulagQuestions[i]);
        if(!answeredCorrect) {
            return;
        }
    }

    // Creates the user in the DB if they didn't exist
    db.users.setCitizenship(member.id, member.guild.id, true);
    channel.watchSend(`Thank you! And welcome loyal comrade to ${channel.guild.name}! 🎉🎉🎉`)
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
    return db.users.setCitizenship(target.id, member.guild.id, false)
    .then(() => {
        return target.roles.forEach((role) => {
            target.removeRole(role);
        })
    })
    .then(() => {
        if(channel) return channel.watchSend(`${target}'s papers have been deleted from record`);
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
            voiceChannel = sender.guild.channels.find(channel => 
                channel.type == 'voice' && 
                channel.name.toLowerCase() === secondMatch.toLowerCase() && 
                channel.parent && 
                channel.parent.name.toLowerCase() === firstMatch.toLowerCase());
            if(voiceChannel == null) {
                if(channel) channel.watchSend('I couldn\'t find a voice channel by that name');
                return;
            }
        }

        // If there is second parameter, then firstMatch is the voice channel name
        else {
            voiceChannel = sender.guild.channels.find(channel => 
                channel.type == 'voice' && 
                channel.name.toLowerCase() === firstMatch.toLowerCase());
            if(voiceChannel == null) {
                if(channel) channel.watchSend('I couldn\'t find a voice channel by that name');
                return;
            }
        }
    }

    // If no voice channel was specified, play the song in the vc the sender is in
    if(voiceChannel == null) {
        voiceChannel = sender.voiceChannel;
    
        if(!voiceChannel) {
            if(channel) return channel.watchSend('Join a voice channel first, comrade!');
            return;
        }
    }
    youtube.play(voiceChannel, links.youtube.anthem, volume);
}

function registerVoter(channel, sender) {
    helper.addRoles(sender, [ discordConfig.roles.voter ])
    .then(() => {
        if(channel) channel.watchSend(`You are now a registered voter!`);
    })
    .catch(() => {
        if(channel) channel.watchSend(`You are already registered, dingus`);
    })
}

function holdVote(channel, sender, mentionedMembers, content, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }
    
    // Remove the command
    content = content.replace(/^!\w+\s+/, '');

    // Replace the mentions with their nicknames and tags
    for(let i = 0; i < mentionedMembers.length; i++) {
        let re = new RegExp(`<@!?${mentionedMembers[i].id}>`);
        let plainText = mentionedMembers[i].user.tag;
        if(mentionedMembers[i].nickname) {
            plainText += ` (${mentionedMembers[i].nickname})`;
        }
        content = content.replace(re, plainText);
    }

    // Get the duration and remove it from the command. It must come at the end
    let timeMatches = content.match(/(\s*\d+[dhms]){1,4}\s*$/gi);
    let endDate;
    if(timeMatches == null) {
        endDate = helper.parseTime('1h');
    }
    else {
        let timeText = timeMatches[0];
        content = content.slice(0, -timeText.length).trim();
        endDate = helper.parseTime(timeText);
    }
    let duration = endDate.diff(dayjs());
    if(duration > 0x7FFFFFFF) {
        duration = 0x7FFFFFFF;
    }

    // Get the options
    let options = content.split(',');
    let voteTally = [];
    let textOptions = '';
    let answersRegEx = '^(';
    for(let i = 0; i < options.length; i++) {
        options[i] = options[i].trim();
        if(options[i].length === 0) {
            continue;
        }
        let votingNum = i + 1;
        textOptions += `${votingNum} - ${options[i]}\n`;
        voteTally.push({ id: votingNum, name: options[i], votes: 0, percentage: '' });
        if(i === options.length - 1) {
            answersRegEx += votingNum;
        }
        else {
            answersRegEx += (votingNum) + '|'
        }
    }
    answersRegEx += ')$'
    if(voteTally.length === 0) {
        if(channel) channel.watchSend('Please try again and specify the options of the vote\nEx: `!HoldVote option a, option b  3h 30m`');
        return;
    }

    // Send out the voting messages
    if(channel) channel.watchSend(`Voting begins now and ends at ${endDate.format(helper.dateFormat)}`);

    let message = {
        prompt: `**A vote is being held in ${sender.guild.name}!**\n`+
        `Please vote for one of the options below by replying with the number of the choice.\n`+
        `Voting ends at ${endDate.format(helper.dateFormat)}\n\n${textOptions}`,
        answer: answersRegEx,
        timeout: duration,
        strict: false
    }

    let voters = helper.convertToRole(sender.guild, discordConfig.roles.voter).members;
    if(voters.size === 0) {
        if(channel) channel.watchSend(`There are no registered voters :monkaS:`);
        return;
    }

    voters.forEach(voter => {
        let dmChannel;
        voter.createDM()
        .then(channel => {
            dmChannel = channel;
            return sendTimedMessage(dmChannel, voter, message, false);
        })
        .then(choice => {
            let msg = `Thank you for your vote!`;
            if(channel) msg += `\nResults will be announced in **${sender.guild.name}/#${channel.name}** when voting is closed`;
            dmChannel.send(msg);
            console.log(`${voter.displayName} chose ${choice}`);
            voteTally.find(v => v.id === parseInt(choice)).votes++;
        })
        .catch(() => {
            dmChannel.send(`Voting has closed.`);
        })
    })

    // Announce results
    setTimeout(function() {
        let totalVotes = 0;

        // Get results 
        voteTally.sort(function(a, b) { return b.votes - a.votes })
        voteTally.forEach(option => {
            totalVotes += option.votes;
        })
        voteTally.forEach(option => {
            option.percentage = `${percentFormat(option.votes / totalVotes)}%`;
        })

        // Format results into table
        let longestName = 0, longestPercent = 0;
        voteTally.forEach(option => {
            if(option.name.length > longestName) { longestName = option.name.length; }
            if(option.percentage.length > longestPercent) { longestPercent = option.percentage.length; }
        })
        let fill = ' ';
        let resultsMsg = '```';
        voteTally.forEach(option => {
            let nameFormatted    = option.name + fill.repeat(longestName - option.name.length);
            let percentFormatted = fill.repeat(longestPercent - option.percentage.length) + option.percentage;
            resultsMsg += `${nameFormatted} | ${percentFormatted} | ${option.votes} votes\n`
        })
        resultsMsg += '```';

        // Check for ties and announce final results
        let ties = [];
        let finalResults = '';
        ties.push(voteTally[0]);
        for(let i = 1; i < voteTally.length; i++) {
            if(voteTally[i].votes == ties[0].votes) {
                ties.push(voteTally[i]);
            }
        }
        if(ties.length > 1) {
            let tieList = '';
            for(let i = 0; i < ties.length; i++) {
                tieList += ties[i].name.toUpperCase();
                if(i === ties.length - 2) {
                    tieList += ', and ';
                }
                else if(i < ties.length - 1) {
                    tieList += ', ';
                }
            }
            finalResults = `Voting is done!\n**There is a ${ties.length}-way tie between ${tieList}** ` + 
            `with ${percentFormat(ties[0].votes / totalVotes)}% of the vote each\n${resultsMsg}`;
        }
        else {
            finalResults = `Voting is done!\n**The winner is ${voteTally[0].name.toUpperCase()}** ` + 
            `with ${percentFormat(voteTally[0].votes / totalVotes)}% of the vote\n${resultsMsg}`;
        }
        if(channel) channel.watchSend(finalResults);
    }, duration);
}

function percentFormat(number) {
    if(isNaN(number)) {
        number = 0;
    }
    return (number * 100).toFixed(2);
}

function whisper(channel, sender, targets, content, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(targets.length === 0) {
        if(channel) channel.watchSend('Please repeat the command and specify who I am whispering to');
        return;
    }
    // remove the command and targeet from the content
    content = content.replace(/^\S+\s+<@!?(\d+)>\s+/, '');

    targets[0].send(content);
}

/**
 * Reports the currency for a list of guildMembers. Pass in an empty array
 * for targets or leave it as null to report the sender's infractions instead
 * 
 * @param {Discord.GuildMember} sender - Whoever issued the command
 * @param {Discord.GuildMember[]} targets An array of guildMember objects to get the infractions for
 */
function getCurrency(sender) {
    sender.createDM()
    .then(dmChannel => {
        helper.reportCurrency(sender, dmChannel);
    })
}

function addCurrency(channel, sender, targets, allowedRole, args) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    if(!args || args.length === 0) {
        if(channel) channel.watchSend('Please try again and specify the amount of money');
        return;
    }

    let amount = 1;
    args.forEach(arg => {
        if(arg.match(/^.\d*(\.\d+)?$/)) {
            arg = arg.replace(/[^\d\.]/g, '');
            amount = parseFloat(arg);
            amount = (Math.floor(amount * 100) / 100);
        }
    })

    if(targets.length === 0) {
        helper.addCurrency(sender, amount);
        return;
    }
    targets.forEach((target) => {
        helper.addCurrency(target, amount);
    })
    if(channel) channel.watchSend('Currency added!');
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
    registerVoter,
    holdVote,
    whisper,
    getCurrency,
    addCurrency
}