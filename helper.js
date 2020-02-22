const connection = require('./config/db-config.json');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://'+connection.user+':'+connection.password+'@localhost:3306/raphtalia');
const infractions = sequelize.import('./sequelize_models/infractions.js');
const infractionLimit = 5;

function helper() {
    this.init = function() {
        sequelize.sync({ force: false })
        .then(() => {
            console.log('Database synced!');
        })
    }

    function getNextRole(member, guild) {
        var curRole = member.highestRole;
    
        // Get the next highest role
        var higherRoles = [];
        guild.roles.forEach(role => {
            if(role.comparePositionTo(curRole) > 0 && role.managed === false) {
                higherRoles.push(role);
            }
        })
        if(higherRoles.length === 0) {
            return null;
        }
        higherRoles.sort(function(role1, role2) {
            return role1.position > role2.position;
        })
        
        return higherRoles[0];
    }
    
    function getPreviousRole(member, guild) {
        var curRole = member.highestRole;
    
        // Get the next highest role
        var lowerRoles = [];
        guild.roles.forEach(role => {
            if(role.comparePositionTo(curRole) < 0 && role.managed === false) {
                lowerRoles.push(role);
            }
        })
        if(lowerRoles.length === 0) {
            return null;
        }
        lowerRoles.sort(function(role1, role2) {
            return role1.position < role2.position;
        })
        
        return lowerRoles[0];
    }
    
    // check if has permission and infracts the member if they don't
    function verifyPermission(member, channel, minRoleName) {
        if(!hasPermission(member, minRoleName)) {
            infract(member, channel, 'I don\'t have to listen to a peasant like you. This infraction has been recorded');
            return false;
        }
    
        return true;
    }
    
    // This function verifies that the member has a role equal to or greater than the role given by minRoleName
    function hasPermission(member, minRoleName) {
        var minRole = member.guild.roles.find(role => role.name.toLowerCase() === minRoleName.toLowerCase());
        if(!minRole) {
            console.log('There is no role \"' + minRoleName + '\". Go check the permissions file');
            return false;
        }
    
        return member.highestRole.comparePositionTo(minRole) >= 0;
    }
    
    function infract(member, channel, reason = '') {
        sequelize.transaction(function(t) {
            return infractions.findOrCreate({
                where: {
                    id: member.id
                },
                transaction: t
            })
            .spread(function(user, created) {
                user.increment('infractionsCount')
                .then((updatedRow) => {
                    var infractionCount = updatedRow.infractionsCount;
                    reportInfractions(member,  channel, reason + '\n');
                    if(infractionCount >= infractionLimit) {
                        exile(member, channel);
                    }
                })
            })
        });
    }
    
    function setInfractions(discordId, amount, channel, reason){
        sequelize.transaction(function(t) {
            return infractions.findOrCreate({
                where: {
                    id: discordId
                },
                transaction: t
            }).spread(function(user, created) {
                user.infractionCount = amount;
                reportInfractions(discordId, channel, reason + '\n');
                if(infractionCount >= infractionLimit) {
                    exile(discordId, channel);
                }
            })
        });
    }
    
    function reportInfractions(member, channel, pretext = '') {
        const discordName = member.toString();
        infractions.findByPk(member.id)
        .then(user => {
            channel.send(pretext + discordName + ' has incurred ' + user.infractionsCount + ' infractions');
        })
        .catch(() => {
            channel.send(discordName + ' is a model citizen <3');
        })
    }
    
    function pardon(member, channel) {
        setRoles(member, channel, []); // clear all roles
        channel.send(member.toString() + ' has been un-exiled');
    }
    
    function exile(member, channel) {
        setRoles(member, channel, ['exile']);
        channel.send('Uh oh, gulag for you ' + member.toString());
    }
    
    // Set the roles of a user. The parameter roles is an array of string (names of roles)
    function setRoles(member, channel, roles) {
        var discordRoles = [];
    
        // Get the backing roles for the names
        for(var i = 0; i < roles.length; i++) {
            var roleObject = channel.guild.roles.find(r => r.name.toLowerCase() === roles[i].toLowerCase());
            if(!roleObject) {
                console.log('Could not find role: ' + roles[i])
                continue;
            }
            discordRoles.push(roleObject);
        }
        
        // Check if user already has roles, including @everyone
        // var hasRoles = true;
        // if(member.roles.size === discordRoles.size + 1) {
        //     discordRoles.forEach(role => {
        //         if(!member.roles.has(role.id)) {
        //             hasRoles = false;
        //         }
        //     })
        // }
    
        // if(hasRoles) {
        //     return;
        // }
    
        member.removeRoles(member.roles)
        .then(() => {
            member.addRoles(discordRoles)
            .catch(() => {
                console.error('Could not add roles to ' + member.toString());
            })
        })
        .catch(() => {
            console.error('Could not remove roles for ' + member.toString());
        })
    }

    // "Public methods"
    this.getNextRole = getNextRole;
    this.getPreviousRole = getPreviousRole;
    this.verifyPermission = verifyPermission;
    this.infract = infract;
    this.setInfractions = setInfractions;
    this.reportInfractions = reportInfractions;
    this.pardon = pardon;
    this.exile = exile;
    this.hasPermission = hasPermission;
    this.setRoles = setRoles;
}

module.exports = helper;