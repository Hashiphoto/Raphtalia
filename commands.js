const links = require('./resources/links.json');
const helper = require('./helper.js');
const db = require('./db.js');
const welcomeQuestions = require('./resources/welcome-questions.json');

function help(channel, sender) {
    channel.send('Help yourself, ' + sender.toString());
}

function getInfractions(channel, sender, targets) {
    if(targets.length === 0) {
        helper.reportInfractions(sender, channel);
    }
    else {
        helper.reportInfractions(targets[0], channel);
    }
}

function kick(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        target.kick()
        .then((member) => {
            channel.send(':wave: ' + member.displayName + ' has been kicked')
            .then(() => {
                let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
                let showkick = links.gifs.kicks[randInt];
                channel.send(showkick);
            })
        })
        .catch(() => {
            channel.send('Something went wrong...');
        })
    })
}

function report(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        helper.infract(target, channel, 'Yes sir~!');
    })
}

function exile(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        helper.exile(target, channel);
    })
}

function softkick(channel, sender, targets, permissionLevel, reason = '') {
    if(sender != null && !helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        channel.createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
        .then(invite => {
            return target.send(reason + invite.toString());
        })
        .then(() => {
            return target.kick();
        })
        .then((member) => {
            return channel.send(':wave: ' + member.displayName + ' has been kicked and invited back');
        })
        // .then(() => {
        //     channel.send(links.gifs.softkick);
        // })
        .catch(() => {
            channel.send('Something went wrong...');
        })
    })
}

function pardon(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        helper.pardon(target, channel);
    })
}

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
            channel.send(target.toString() + ' holds the highest office already');
            return;
        }

        // Ensure the target's next highest role is not higher than the sender's
        if(sender.highestRole.comparePositionTo(nextHighest) < 0) {
            helper.infract(sender, channel, 'You can\'t promote above your own role');
            return;
        }

        // promote the target
        helper.setRoles(target, channel, [nextHighest.name]);
        channel.send(target.toString() + ' has been promoted to ' + nextHighest.name + '!');
    })
}

function demote(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((target) => {
        // Ensure the sender has a higher rank than the target
        if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
            helper.infract(sender, channel, target.toString() + ' holds a higher rank than you!!!');
            return;
        }

        let nextLowest = helper.getPreviousRole(target, channel.guild);

        if(nextLowest == null) {
            channel.send(target.toString() + ' can\'t get any lower');
            return;
        }

        // promote the target
        helper.setRoles(target, channel, [nextLowest.name]);
        let roleName = nextLowest.name;
        if(roleName === '@everyone') {
            roleName = 'commoner';
        }
        channel.send(target.toString() + ' has been demoted to ' + roleName + '!');
    })
}

function comfort(channel, sender, targets, permissionLevel) {
    if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

    targets.forEach((member) => {
        channel.send(member.toString() + ' headpat');
    })
}

function pledge(channel, sender, args) {
    if(args.length == 0 && helper.hasRole(sender, 'immigrant')) {
        db.papers.createOrUpdate(sender.id, true);
        channel.send('Thank you! And welcome loyal comrade to ' + channel.guild.name + '!')
        .then(() => {
            helper.setRoles(sender, channel, [ 'comrade' ]);
        })
    }
}

/**
 * Send a message and wait for the first matching response
 * 
 * @param {channel} channel the channel to send the message and listen for responses
 * @param {object} qItem An object containing question, answer, timeout (in ms)
 * @return {promise} A Promise(collected) with the collection of messages received
 *                   Or .catch() if there are no responses
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

async function arrive(channel, member) {
    let paper = await db.papers.get(member.id);
    if(paper == null) {
        channel.send(`Welcome ${member} to ${channel.guild.name}! I just have a few questions for you, and then you can enjoy go beautiful community with your fellow comrades.`);
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
            channel.send('Thank you! And welcome loyal comrade to ' + channel.guild.name + '!')
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

// TESTING ONLY
function unarrive(channel, member, mentions) {
    let target = member;
    if(mentions.length > 0) {   
        target = mentions[0];
    }
    db.papers.delete(target.id)
    .then(() => {
        return target.roles.forEach((role) => {
            target.removeRole(role);
        })
    })
    .then(() => {
        return channel.send(target.toString() + '\'s papers have been deleted from record');
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
    pledge,

    arrive,
    unarrive
}