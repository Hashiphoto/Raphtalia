// Node libraries
const Discord = require('discord.js');
const diacritic = require('diacritic-regex');

// Files
const discordConfig = require('./config/discord.json')[process.env.NODE_ENV || 'dev'];
const helper = require('./helper.js');
const db = require('./db.js');

async function rebuildCensorshipList(guildId) {
    let bannedWords = await db.bannedWords.getAll(guildId);
    let regexString = '(^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(';
    for(let i = 0; i < bannedWords.length; i++) {
        // Last word
        if(i === bannedWords.length - 1) {
            regexString += diacritic.toString()(bannedWords[i].word);
        }
        else {
            regexString += diacritic.toString()(bannedWords[i].word) + '|';
        }
    }
    regexString += ')(?![a-zA-Z0-9À-ÖØ-öø-ÿ])';

    return db.guilds.updateCensorshipRegex(guildId, regexString);
}

/**
 * Check a message for banned words and censor it appropriately
 * 
 * @param {Discord.Message} message - The message to check for censorship
 * @returns {Boolean} - True if the message was censored
 */
function censorMessage(message) {
    return db.guilds.get(message.guild.id)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            channel.send('Censorship is currently disabled');
            return Promise.reject('Censorship is disabled'); 
        }

        return guild;
    })
    .then(guild => {
        const sender = message.guild.members.get(message.author.id);
    
        // The supreme dictator is not censored. Also, immigrants are handled by the Arrive command
        if(helper.hasRole(sender, discordConfig.roles.leader) || helper.hasRole(sender, discordConfig.roles.immigrant)) {
            return false;
        }
        
        let bannedRegex = new RegExp(guild.censor_regex, 'gi');
        if(message.content.match(bannedRegex) != null) { 
            message.delete();
            message.channel.send({embed: {
                title: 'Censorship Report',
                description: `What ${sender} ***meant*** to say is \n> ${message.content.replace(bannedRegex, '██████')}`,
                color: 13057084,
                timestamp: new Date()
            }});
    
            helper.addInfractions(sender, message.channel, 1, 'This infraction has been recorded');
            return true;
        }
    
        return false;
    })
    .catch(() => {})
}

function containsBannedWords(text) {
    return db.guilds.get(message.guild.id)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            channel.send('Censorship is currently disabled');
            return Promise.reject('Censorship is disabled'); 
        }
        
        return text.match(bannedRegex) != null;
    })
    .catch(() => {})
}

function banWords(channel, sender, words, permissionLevel) {
    return db.guilds.get(channel.guild.id)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            channel.send('Censorship is currently disabled');
            return Promise.reject('Censorship is disabled'); 
        }

        if(words.length === 0) {
            printBanList(channel);
            return;
        }
    
        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }
    
        // Construct an array of rows to insert into the db
        let values = [];
        words.forEach(word => {
            values.push([ word, channel.guild.id ]);
        })
        db.bannedWords.insert(values)
        .then(() => {
            rebuildCensorshipList(channel.guild.id);
        })
        channel.send(`You won't see these words again: ${words}`);
    })
    .catch(() => {})
}

function allowWords(channel, sender, words, permissionLevel) {
    return db.guilds.get(channel.guild.id)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            channel.send('Censorship is currently disabled');
            return Promise.reject('Censorship is disabled');
        }

        if(words.length === 0) {
            printBanList(channel);
            return;
        }

        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

        db.bannedWords.delete(channel.guild.id, words)
        .then(() => {
            rebuildCensorshipList(channel.guild.id);
        })
        channel.send(`These words are allowed again: ${words}`);
    })
    .catch(() => {})
}

function printBanList(channel) {
    db.bannedWords.getAll(channel.guild.id)
    .then(rows => {
        let banList = '';
        for(let i = 0; i < rows.length; i++) {
            if(rows[i].word.includes(' ')){
                banList += `'${rows[i].word}'`;
            }
            else {
                banList += `${rows[i].word}`;
            }
            if(i !== rows.length - 1) {
                banList += ', ';
            }
        }
        channel.send(`Here are all the banned words: ${banList}`);
    })
}

function enable(channel, sender, isCensoring, allowedRole) {
    if(!helper.verifyPermission(sender, channel, allowedRole)) { return; }

    db.guilds.setCensorship(channel.guild.id, isCensoring)
    .then(() => {
        if(isCensoring) {
            printBanList(channel);
        }
        else {
            channel.send('All speech is permitted!');
        }
    })
}

module.exports = {
    censorMessage,
    banWords,
    allowWords,
    containsBannedWords,
    enable
}