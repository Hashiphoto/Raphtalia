// Node libraries
const Discord = require('discord.js');

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
    let regexString = '\\b(';
    for(let i = 0; i < bannedWords.length; i++) {
        // Last word
        if(i === bannedWords.length - 1) {
            regexString += bannedWords[i].word;
        }
        else {
            regexString += bannedWords[i].word + '|';
        }
    }
    regexString += ')\\b';
    console.log(`Banned words: ${regexString}`);
    bannedRegex = new RegExp(regexString, 'gi');
}

/**
 * Check a message for banned words and censor it appropriately
 * 
 * @param {Discord.Message} message - The message to check for censorship
 */
function censorMessage(message) {
    const sender = message.guild.members.get(message.author.id);
    if(helper.hasPermission(sender, discordConfig.roles.dictator)) {
        return;
    }
    
    // simple banned words
    if(message.content.match(bannedRegex) != null) {
        const fixedMessage = 'I fixed ' + sender.toString() + '\'s message\n>>> ' + message.content.replace(bannedRegex, '██████');
        message.delete();
        message.channel.send(fixedMessage);

        helper.addInfractions(sender, message.channel, 1, 'This infraction has been recorded');
    }
    // supreme leader disrespect
    else if(message.content.match(/^(long live|all hail|glory to|hail)/gi) != null &&
            !message.mentions.roles.find(role => role.name === 'Supreme Dictator') &&
            message.content.match(/(gulag|supreme leader|leader|erkin|dictator|supreme dictator)/gi) == null) {
        helper.addInfractions(sender, message.channel, 1, 'Glory to the Supreme Dictator _alone!_ This infraction has been recorded');
    }
    // :flag_us:
    else if(message.content.includes('🇺🇸')) {
        message.delete();
        helper.addInfractions(sender, message.channel, 1, 'What flag is that, comrade?');
    }
}

function banWords(channel, sender, words, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    if(words.length === 0) {
        db.bannedWords.getAll()
        .then(rows => {
            let banList = '';
            for(let i = 0; i < rows.length; i++) {
                if(rows[i].word.includes(" ")){
                    banList += `"${rows[i].word}"`;
                }
                else {
                    banList += `${rows[i].word}`;
                }
                if(i !== rows.length - 1) {
                    banList += ", ";
                }
            }

            channel.send(`Here are all the banned words: ${banList}`);
        })
        
        return;
    }

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
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    db.bannedWords.delete(words)
    .then(() => {
        rebuildCensorshipList();
    })
    channel.send(`These words are allowed again: ${words}`);
}

module.exports = {
    censorMessage,
    banWords,
    allowWords
}