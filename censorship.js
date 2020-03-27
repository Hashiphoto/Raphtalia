// Node libraries
const Discord = require('discord.js');
const diacritic = require('diacritic-regex');

// Files
const discordConfig = require('./config/discord.json')[process.env.NODE_ENV || 'dev'];
const helper = require('./helper.js');
const db = require('./db.js');

// Objects
var bannedRegex;

/**
 * Load all the banned words on startup
 */
(function(){
    rebuildCensorshipList();
})();

async function rebuildCensorshipList() {
    let bannedWords = await db.bannedWords.getAll();
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
    console.log(`Banned words: ${regexString}`);
    bannedRegex = new RegExp(regexString, 'gi');
}

/**
 * Check a message for banned words and censor it appropriately
 * 
 * @param {Discord.Message} message - The message to check for censorship
 * @returns {Boolean} - True if the message was censored
 */
function censorMessage(message) {
    const sender = message.guild.members.get(message.author.id);
    // The supreme dictator is not censored. Also, immigrants are handled by the Arrive command
    if(helper.hasPermission(sender, discordConfig.roles.dictator) || helper.hasRole(sender, 'immigrant')) {
        return false;
    }
    
    // simple banned words
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
    // supreme leader disrespect
    else if(message.content.match(/^(long live|all hail|glory to|hail)/gi) != null &&
            !message.mentions.roles.find(role => role.name === 'Supreme Dictator') &&
            message.content.match(/(gulag|supreme leader|leader|erkin|dictator|supreme dictator)/gi) == null) {
        helper.addInfractions(sender, message.channel, 1, 'Glory to the Supreme Dictator _alone!_ This infraction has been recorded');
        return true;
    }
    // :flag_us:
    else if(message.content.includes('🇺🇸')) {
        message.delete();
        helper.addInfractions(sender, message.channel, 1, 'What flag is that, comrade?');
        return true;
    }

    return false;
}

function containsBannedWords(text) {
    return text.match(bannedRegex) != null;
}

function banWords(channel, sender, words, permissionLevel) {
    if(words.length === 0) {
        printBanList(channel);
        return;
    }

    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    // Construct an array of rows to insert into the db
    let values = [];
    words.forEach(word => {
        values.push([ word ]);
    })
    db.bannedWords.insert(values)
    .then(() => {
        rebuildCensorshipList();
    })
    channel.send(`You won't see these words again: ${words}`);
}

function allowWords(channel, sender, words, permissionLevel) {
    if(words.length === 0) {
        printBanList(channel);
        return;
    }

    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    db.bannedWords.delete(words)
    .then(() => {
        rebuildCensorshipList();
    })
    channel.send(`These words are allowed again: ${words}`);
}

function printBanList(channel) {
    db.bannedWords.getAll()
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

module.exports = {
    censorMessage,
    banWords,
    allowWords,
    containsBannedWords
}