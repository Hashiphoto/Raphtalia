const links = require('./links.json');

function commands(helper) {
    this.init = function() {

    }

    this.help = function(channel, sender) {
        channel.send('Help yourself, ' + sender.toString());
    }

    this.getInfractions = function(channel, sender, targets) {
        if(targets.length === 0) {
            helper.reportInfractions(sender, channel);
        }
        else {
            helper.reportInfractions(targets[0], channel);
        }
    }

    this.kick = function(channel, sender, targets, permissionLevel) {
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

    this.report = function(channel, sender, targets, permissionLevel) {
        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

        targets.forEach((target) => {
            helper.infract(target, channel, 'Yes sir~!');
        })
    }

    this.exile = function(channel, sender, targets, permissionLevel) {
        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

        targets.forEach((target) => {
            helper.exile(target, channel);
        })
    }

    this.softkick = function(channel, sender, targets, permissionLevel) {
        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

        targets.forEach((target) => {
            channel.createInvite({ temporary: true, maxAge: 300, maxUses: 1, unique: true })
            .then(invite => {
                target.send(invite.toString())
                .then(() => {
                    target.kick()
                    .then((member) => {
                        channel.send(':wave: ' + member.displayName + ' has been kicked and invited back')
                        .then(() => {
                            channel.send(links.gifs.softkick);
                        })
                    })
                    .catch(() => {
                        channel.send('Something went wrong...');
                    })
                })
            })
        })
    }

    this.pardon = function(channel, sender, targets, permissionLevel) {
        if(!helper.verifyPermission(sender, channel, permissionLevel)) { return; }

        targets.forEach((target) => {
            helper.pardon(target, channel);
        })
    }

    this.promote = function(channel, sender, targets, permissionLevel) {
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

    this.demote = function(channel, sender, targets, permissionLevel) {
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
}

module.exports = commands;