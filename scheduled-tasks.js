const Discord = require('discord.js');
var CronJob = require('cron').CronJob;

const commands = require('./commands.js');
const helper = require('./helper.js');
const db = require('./db.js');

var client;

/**
 * CRON Quick Refernce
    * * * * *
    | | | | |
    | | | | ----- Day of week (0 - 7) (Sunday=0 or 7)
    | | | ------- Month (1 - 12)
    | | --------- Day of month (1 - 31)
    | ----------- Hour (0 - 23)
    ------------- Minute (0 - 59)
    
    @yearly, @monthly, @weekly, @daily, @hourly,
 */

function init(client) {
    /**
     * Daily Income. Runs at midnight every day
     */
    new CronJob('0 0 * * *', function() {
        client.guilds.forEach(guild => {
            dailyIncome(guild);
        })
    }, null, true, 'America/Los_Angeles');
}

function dailyIncome(guild) {
    guild.members.forEach(member => {
        if(!member.hoistRole) return;

        let highestRoleId = member.hoistRole.id;
        db.roles.getSingle(highestRoleId)
        .then(dbRole => {
            return dbRole.income;
        })
        .then((income) => {
            if(income === 0) return;
            db.users.incrementCurrency(member.id, member.guild.id, income);
        })
    })
}

function tax(guild) {
    db.guilds.get(guild.id)
    .then(guild => {
        return guild.tax_rate;
    })
    .then(taxRate => {
        guild.members.forEach(member => {
            if(!member.hoistRole) return;
    
            let highestRoleId = member.hoistRole.id;
            db.roles.getSingle(highestRoleId)
            .then(dbRole => {
                return dbRole.income;
            })
            .then((income) => {
                if(income === 0) return;
                let weeklyIncome = income * 7;
                let tax = weeklyIncome * taxRate;
                db.users.incrementCurrency(member.id, member.guild.id, -tax);
            })
        })
    })
}

module.exports = {
    init,
    dailyIncome,
    tax
}