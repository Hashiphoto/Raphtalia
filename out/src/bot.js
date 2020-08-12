"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefix = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
const commands_1 = __importDefault(require("./commands"));
const helper_js_1 = __importDefault(require("./helper.js"));
const censorship_js_1 = __importDefault(require("./censorship.js"));
const scheduled_tasks_1 = require("./scheduled-tasks");
const RMessage_1 = __importDefault(require("./structures/RMessage"));
const RChannel_1 = __importDefault(require("./structures/RChannel"));
const RGuild_1 = __importDefault(require("./structures/RGuild"));
const client = new discord_js_1.default.Client();
exports.prefix = "!";
// I would like to find an alternative way to import these because doing it this way doesn't
// allow us to do any type checking on their properties. However, we can't use "require" since
// the typescript compiler can't find the files at compile time.
var discordConfig;
var secretConfig;
(function init() {
    return __awaiter(this, void 0, void 0, function* () {
        discordConfig = yield Promise.resolve().then(() => __importStar(require("../config/discord.json"))).then((configFile) => {
            return process.env.NODE_ENV == "dev" ? configFile.dev : configFile.prod;
        });
        secretConfig = yield Promise.resolve().then(() => __importStar(require("../config/secrets.json"))).then((configFile) => {
            return process.env.NODE_ENV == "dev" ? configFile.dev : configFile.prod;
        });
        client.once("ready", () => {
            console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
        });
        client.login(secretConfig.discord.token).then(() => {
            console.log(`Logged in! Listening for events`);
        });
        scheduled_tasks_1.init(client);
    });
})();
// require("log-timestamp")(() => {
//   return `[${dayjs().format(`MMMD,YY|hh:mm:ssA`)}] %s`;
// });
/**
 * When the client is ready, do this once
 */
client.on("message", (message) => {
    if (message.author.bot) {
        return;
    }
    if (message.channel.type !== "text" || message.type !== "DEFAULT") {
        return;
    }
    // Create custom objects wrapping original discord objects
    const rMessage = new RMessage_1.default(message);
    const rGuild = new RGuild_1.default(message.guild);
    const rChannel = new RChannel_1.default(message.channel);
    // If this message was sent in an auto delete channel, delete it too
    if (rChannel.dbChannel && rChannel.dbChannel.delete_ms >= 0) {
        setTimeout(function () {
            message.delete().catch((error) => {
                console.error("Message was probably already deleted\n" + error);
            });
        }, rChannel.dbChannel.delete_ms);
    }
    if (rMessage.o.content.startsWith(exports.prefix)) {
        processCommand(rMessage, rChannel, rGuild);
    }
    else {
        // censorship
        //   .censorMessage(message)
        //   .then((censored) => {
        //     if (censored || rChannel.autoDelete) return;
        //     return db.guilds.get(message.guild.id);
        //   })
        //   .then((dbGuild) => {
        //     if (!dbGuild) return;
        //     if (message.content.length < dbGuild.min_length) return;
        //     let amount = Math.min(
        //       dbGuild.base_payout +
        //         message.content.length * dbGuild.character_value,
        //       dbGuild.max_payout
        //     );
        //     let sender = message.guild.members.get(message.author.id);
        //     if (process.env.NODE_ENV === "dev") {
        //       // message.channel.send(`\`Debug only\` | ${sender} +$${amount.toFixed(2)}`);
        //     }
        //     return helper.addCurrency(sender, amount);
        //   });
    }
});
// client.on("guildMemberAdd", (member) => {
//   const welcomeChannel = client.channels.get(
//     discordConfig.channels.welcomeChannelId
//   );
//   const rChannel = new RChannel(welcomeChannel as TextChannel);
//   commands.arrive(rChannel, member);
// });
// client.on("guildMemberRemove", (member) => {
//   db.users.setCitizenship(member.id, member.guild.id, false);
// });
client.on("disconnect", function (event) {
    console.log("Bot disconnecting");
    process.exit();
});
function processCommand(message, channel, guild) {
    return __awaiter(this, void 0, void 0, function* () {
        // args contains every word after the command in an array
        const args = message.o.content.slice(exports.prefix.length).split(/\s+/);
        const command = args.shift().toLowerCase();
        switch (command) {
            case "help":
                commands_1.default.help(message, channel, guild);
                break;
            case "infractions":
                commands_1.default.getInfractions(message, channel, guild);
                break;
            case "kick":
                commands_1.default.kick(message, channel, guild, discordConfig.roles.gov);
                break;
            case "infract":
            case "report":
                commands_1.default.report(message, channel, guild, discordConfig.roles.gov);
                break;
            case "exile":
                commands_1.default.exile(message, channel, guild, discordConfig.roles.gov, helper_js_1.default.parseTime(message.o.content));
                break;
            case "softkick":
                commands_1.default.softkick(message, channel, guild, discordConfig.roles.gov);
                break;
            case "pardon":
                commands_1.default.pardon(message, channel, guild, discordConfig.roles.leader);
                break;
            case "promote":
                commands_1.default.promote(message, channel, guild, discordConfig.roles.gov);
                break;
            case "demote":
                commands_1.default.demote(message, channel, guild, discordConfig.roles.gov);
                break;
            case "comfort":
                commands_1.default.comfort(message, channel, guild, discordConfig.roles.leader);
                break;
            // TESTING ONLY
            case "unarrive":
                commands_1.default.unarrive(message, channel, guild, discordConfig.roles.gov);
                break;
            case "anthem":
            case "sing":
            case "play":
                commands_1.default.play(message, channel, guild, discordConfig.roles.gov);
                break;
            case "banword":
            case "banwords":
            case "bannedwords":
                censorship_js_1.default.banWords(message, channel, guild, discordConfig.roles.gov);
                break;
            case "allowword":
            case "allowwords":
            case "unbanword":
            case "unbanwords":
                censorship_js_1.default.allowWords(message, channel, guild, discordConfig.roles.gov);
                break;
            // case "enablecensorship":
            //   censorship.enable(
            //     message,
            //     channel,
            //     guild,
            //     true,
            //     discordConfig.roles.leader
            //   );
            //   break;
            // case "disablecensorship":
            //   censorship.enable(
            //     message,
            //     channel,
            //     guild,
            //     false,
            //     discordConfig.roles.leader
            //   );
            //   break;
            case "register":
                commands_1.default.registerVoter(message, channel, guild);
                break;
            case "holdvote":
                commands_1.default.holdVote(message, channel, guild, discordConfig.roles.leader);
                break;
            // Needs more work for it to be useful
            // case 'whisper':
            //     commands.whisper(responseChannel, sender, mentionedMembers, message.content, discordConfig.roles.leader);
            //     break;
            case "wallet":
            case "balance":
            case "cash":
            case "bank":
            case "money":
            case "currency":
                commands_1.default.getCurrency(message, channel, guild);
                break;
            case "autodelete":
                commands_1.default.setAutoDelete(message, channel, guild, discordConfig.roles.leader);
                break;
            case "give":
                commands_1.default.giveCurrency(message, channel, guild);
                break;
            case "fine":
                commands_1.default.fine(message, channel, guild, discordConfig.roles.gov);
                break;
            case "economy":
                commands_1.default.setEconomy(message, channel, guild, discordConfig.roles.leader);
                break;
            case "income":
                commands_1.default.income(message, channel, guild, discordConfig.roles.leader);
                break;
            case "doincome":
                if (process.env.NODE_ENV !== "dev") {
                    break;
                }
                scheduled_tasks_1.dailyIncome(guild);
                channel.send("`Debug only` | Income has been distributed");
                break;
            case "dotaxes":
                if (process.env.NODE_ENV !== "dev") {
                    break;
                }
                scheduled_tasks_1.tax(guild);
                channel.send("`Debug only` | Members have been taxed");
                break;
            case "purchase":
            case "buy":
                commands_1.default.buy(message, channel, guild);
                break;
            case "roleprice":
                commands_1.default.setRolePrice(message, channel, guild, discordConfig.roles.leader);
                break;
            case "delivercheck":
                commands_1.default.createMoney(message, channel, guild, discordConfig.roles.leader);
                break;
            case "serverstatus":
                commands_1.default.postServerStatus(message, channel, guild, discordConfig.roles.leader);
                break;
            default:
                if (channel) {
                    channel.send(`I think you're confused, Comrade ${message.sender}`);
                }
        }
    });
}
exports.default = client;
//# sourceMappingURL=bot.js.map