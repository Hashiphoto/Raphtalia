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
            return false; 
        }

        const sender = message.guild.members.get(message.author.id);
    
        // The supreme dictator is not censored. Also, immigrants are handled by the Arrive command
        if(helper.hasRole(sender, discordConfig.roles.leader) || helper.hasRole(sender, discordConfig.roles.immigrant)) {
            return false;
        }
        
        let bannedRegex = new RegExp(guild.censor_regex, 'gi');
        if(message.content.match(bannedRegex) == null) {
            return false;
        }
        
        message.delete();
        if(message.channel) {
            message.channel.watchSend({embed: {
                title: 'Censorship Report',
                description: `What ${sender.displayName} ***meant*** to say is \n> ${message.content.replace(bannedRegex, '██████')}`,
                color: 13057084,
                timestamp: new Date()
            }});
        }

        helper.addInfractions(sender, message.channel, 1, `This infraction has been recorded`);
        return true;
    })
}

function containsBannedWords(guildId, text) {
    return db.guilds.get(guildId)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            return false; 
        }
        
        return text.match(guild.censor_regex) != null;
    })
}

function banWords(channel, sender, words, permissionLevel) {
    return db.guilds.get(sender.guild.id)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            if(channel) return channel.watchSend('Censorship is currently disabled');
            return;
        }

        if(words.length === 0) {
            printBanList(channel);
            return;
        }
    
        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }
    
        // Construct an array of rows to insert into the db
        let values = [];
        words.forEach(word => {
            values.push([ word, sender.guild.id ]);
        })
        db.bannedWords.insert(values)
        .then(() => {
            rebuildCensorshipList(sender.guild.id);
        })
        if(channel) return channel.watchSend(`You won't see these words again: ${words}`);
    })
}

function allowWords(channel, sender, words, permissionLevel) {
    return db.guilds.get(sender.guild.id)
    .then(guild => {
        if(!guild.censorship_enabled) { 
            if(channel) return channel.watchSend('Censorship is currently disabled');
            return;
        }

        if(words.length === 0) {
            printBanList(channel);
            return;
        }

        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

        db.bannedWords.delete(sender.guild.id, words)
        .then(() => {
            rebuildCensorshipList(sender.guild.id);
        })
        if(channel) return channel.watchSend(`These words are allowed again: ${words}`);
    })
}

function printBanList(channel) {
    if(!channel) return;
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
        if(channel) return channel.watchSend(`Here are all the banned words: ${banList}`);
    })
}

function enable(channel, sender, isCensoring, allowedRole) {
    if(!helper.hasRoleOrHigher(sender, allowedRole)) { 
        return permissionInfract(channel);
    }
    db.guilds.setCensorship(sender.guild.id, isCensoring)
    .then(() => {
        if(isCensoring) {
            return printBanList(channel);
        }
        else {
            if(channel) return channel.watchSend('All speech is permitted!');
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