let commands = require('./commands.js');
let getNextRole = commands.getNextRole();
let getPreviousRole = commands.getPreviousRole();
let doForEachMention = commands.doForEachMention();
let censor = commands.censor();
let verifyPermission = commands.verifyPermission();
let hasPermission = commands.hasPermission();
let infract = commands.infract();
let setInfractions = commands.setInfractions();
let reportInfractions = commands.reportInfractions();
let pardon = commands.pardon();
let exile = commands.exile();
let setRoles = commands.setRoles();
let getUserFromMention = commands.getUserFromMention();

exports.processCommand = function(message) {
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    var sender = message.guild.members.get(message.author.id);

    switch(command){
    case 'help' :
        message.channel.send('Help yourself, ' + message.member.toString());
        break;
    case 'infractions' :
        if(message.mentions.users.size === 0) {
            reportInfractions(sender.id, message.channel);
        }
        break;
    /*case 'setinfract':
        if(!verifyPermission(sender, message.channel, permissions.setinfract)){
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            setInfractions(target.id, message.channel, 'Yes sir~!');
        }).catch(()=> {
            message.channel.send('Something went wrong...');
            message.channel.send('Proper format is setinfract ');
        })

        break;*/
    case 'kick' :
        if(!verifyPermission(sender, message.channel, permissions.kick)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            target.kick().then((member) => {
                message.channel.send(':wave: ' + member.displayName + ' has been kicked')
                .then(() => {
                    let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
                    let showkick = links.gifs.kicks[randInt];
                    message.channel.send(showkick);
                })
            }).catch(() => {
                message.channel.send('Something went wrong...');
            })
        })
        break;
    case 'report' :
        if(!verifyPermission(sender, message.channel, permissions.report)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            infract(target.id, message.channel, 'Yes sir~!');
        })
        break;
    case 'exile' :
        if(!verifyPermission(sender, message.channel, permissions.exile)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            exile(target.id, message.channel);
        })
        break;
    case 'softkick' :
        if(!verifyPermission(sender, message.channel, permissions.kick)) {
            return; 
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            message.channel.createInvite({temporary: true, maxAge: 300, maxUses: 1, unique: true})
            .then(invite => {
                target.send(invite.toString())
                .then(() => {
                    target.kick().then((member) => {
                        message.channel.send(':wave: ' + member.displayName + ' has been kicked and invited back')
                        .then(() => {
                            message.channel.send(links.gifs.softkick);
                        })
                    }).catch(() => {
                        message.channel.send('Something went wrong...');
                    })
                })
            })

        })
        break;
    case 'pardon' :
        if(!verifyPermission(sender, message.channel, permissions.pardon)) {
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            pardon(target.id, message.channel);
        })
        break;
    case 'promote' :
        if(!verifyPermission(sender, message.channel, permissions.promote)) {
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            // Disallow self-promotion
            if(sender.id === target.id) {
                infract(sender.id, message.channel, links.gifs.bernieNo);
                return;
            }

            var nextHighest = getNextRole(target, message.guild);

            if(nextHighest == null) {
                message.channel.send(target.toString() + ' holds the highest office already');
                return;
            }

            // Ensure the target's next highest role is not higher than the sender's
            if(sender.highestRole.comparePositionTo(nextHighest) < 0) {
                infract(sender.id, message.channel, 'You can\'t promote above your own role');
                return;
            }

            // promote the target
            setRoles(target.id, message.channel, [nextHighest.name]);
            message.channel.send(target.toString() + ' has been promoted to ' + nextHighest.name + '!');
        })
        break;
    case 'demote' :
        if(!verifyPermission(sender, message.channel, permissions.promote)) {
            return;
        }

        doForEachMention(sender, message.channel, args, (sender, target) => {
            // Ensure the sender has a higher rank than the target
            if(sender.highestRole.comparePositionTo(target.highestRole) < 0) {
                infract(sender.id, message.channel, target.toString() + ' holds a higher rank than you!!!');
                return;
            }

            var nextLowest = getPreviousRole(target, message.guild);

            if(nextLowest == null) {
                message.channel.send(target.toString() + ' can\'t get any lower');
                return;
            }

            // promote the target
            setRoles(target.id, message.channel, [nextLowest.name]);
            var roleName = nextLowest.name;
            if(roleName === everyoneRole) {
                roleName = 'commoner';
            }
            message.channel.send(target.toString() + ' has been demoted to ' + roleName + '!');
        })
        break;
    }
}