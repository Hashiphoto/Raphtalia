"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tax = exports.dailyIncome = exports.init = void 0;
const cron_1 = require("cron");
const helper_js_1 = __importDefault(require("./helper.js"));
const db_js_1 = __importDefault(require("./db.js"));
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
    new cron_1.CronJob("0 0 * * *", function () {
        client.guilds.forEach((guild) => {
            dailyIncome(guild);
        });
    }, null, true, "America/Los_Angeles");
    /**
     * Weekly Taxes. Runs at Sunday midnight
     */
    new cron_1.CronJob("0 0 * * 0", function () {
        client.guilds.forEach((guild) => {
            tax(guild);
        });
    }, null, true, "America/Los_Angeles");
}
exports.init = init;
function dailyIncome(guild) {
    guild.members.forEach((member) => {
        if (!member.hoistRole)
            return;
        let highestRoleId = member.hoistRole.id;
        db_js_1.default.roles
            .getSingle(highestRoleId)
            .then((dbRole) => {
            return dbRole.income;
        })
            .then((income) => {
            if (income === 0)
                return;
            db_js_1.default.users.incrementCurrency(member.id, member.guild.id, income);
        });
    });
}
exports.dailyIncome = dailyIncome;
function tax(guild) {
    db_js_1.default.guilds
        .get(guild.id)
        .then((guild) => {
        return guild.tax_rate;
    })
        .then((taxRate) => {
        // Get the highest hoisted role that has members in it.
        let leaderRole = helper_js_1.default.getLeaderRole(guild);
        if (!leaderRole) {
            return;
        }
        guild.members.forEach((member) => {
            if (!member.hoistRole)
                return;
            let highestRoleId = member.hoistRole.id;
            db_js_1.default.roles
                .getSingle(highestRoleId)
                .then((dbRole) => {
                return dbRole.income;
            })
                .then((income) => {
                if (income === 0)
                    return;
                let weeklyIncome = income * 7;
                let tax = weeklyIncome * taxRate;
                db_js_1.default.users.incrementCurrency(member.id, member.guild.id, -tax);
                leaderRole.members.forEach((member) => {
                    db_js_1.default.users.incrementCurrency(member.id, member.guild.id, tax / leaderRole.members.size);
                });
            });
        });
    });
}
exports.tax = tax;
//# sourceMappingURL=scheduled-tasks.js.map