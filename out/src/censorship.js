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
const diacritic_regex_1 = __importDefault(require("diacritic-regex"));
// Files
var discordConfig;
Promise.resolve().then(() => __importStar(require("../config/discord.json"))).then((configFile) => {
    discordConfig =
        process.env.NODE_ENV == "dev" ? configFile.dev : configFile.prod;
});
const helper_js_1 = __importDefault(require("./helper.js"));
const db_js_1 = __importDefault(require("./db.js"));
function rebuildCensorshipList(guildId) {
    return __awaiter(this, void 0, void 0, function* () {
        let bannedWords = yield db_js_1.default.bannedWords.getAll(guildId);
        let regexString = "(^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(";
        for (let i = 0; i < bannedWords.length; i++) {
            // Last word
            if (i === bannedWords.length - 1) {
                regexString += diacritic_regex_1.default.toString()(bannedWords[i].word);
            }
            else {
                regexString += diacritic_regex_1.default.toString()(bannedWords[i].word) + "|";
            }
        }
        regexString += ")(?![a-zA-Z0-9À-ÖØ-öø-ÿ])";
        return db_js_1.default.guilds.updateCensorshipRegex(guildId, regexString);
    });
}
/**
 * Check a message for banned words and censor it appropriately
 *
 * @param {Discord.Message} message - The message to check for censorship
 * @returns {Boolean} - True if the message was censored
 */
function censorMessage(message) {
    return db_js_1.default.guilds.get(message.guild.id).then((guild) => {
        if (!guild.censorship_enabled) {
            return false;
        }
        const sender = message.guild.members.get(message.author.id);
        // The supreme dictator is not censored. Also, immigrants are handled by the Arrive command
        if (helper_js_1.default.hasRole(sender, discordConfig.roles.leader) ||
            helper_js_1.default.hasRole(sender, discordConfig.roles.immigrant)) {
            return false;
        }
        let bannedRegex = new RegExp(guild.censor_regex, "gi");
        if (message.content.match(bannedRegex) == null) {
            return false;
        }
        message.delete();
        if (message.channel) {
            message.channel.watchSend({
                embed: {
                    title: "Censorship Report",
                    description: `What ${sender.displayName} ***meant*** to say is \n> ${message.content.replace(bannedRegex, "██████")}`,
                    color: 13057084,
                    timestamp: new Date(),
                },
            });
        }
        helper_js_1.default.addInfractions(sender, message.channel, 1, `This infraction has been recorded`);
        return true;
    });
}
function containsBannedWords(guildId, text) {
    return db_js_1.default.guilds.get(guildId).then((guild) => {
        if (!guild.censorship_enabled) {
            return false;
        }
        return text.match(guild.censor_regex) != null;
    });
}
function banWords(channel, sender, words, permissionLevel) {
    return db_js_1.default.guilds.get(sender.guild.id).then((guild) => {
        if (!guild.censorship_enabled) {
            if (channel)
                return channel.watchSend("Censorship is currently disabled");
            return;
        }
        if (words.length === 0) {
            printBanList(channel);
            return;
        }
        if (!helper_js_1.default.verifyPermission(sender, channel, permissionLevel)) {
            return;
        }
        // Construct an array of rows to insert into the db
        let values = [];
        words.forEach((word) => {
            values.push([word, sender.guild.id]);
        });
        db_js_1.default.bannedWords.insert(values).then(() => {
            rebuildCensorshipList(sender.guild.id);
        });
        if (channel)
            return channel.watchSend(`You won't see these words again: ${words}`);
    });
}
function allowWords(channel, sender, words, permissionLevel) {
    return db_js_1.default.guilds.get(sender.guild.id).then((guild) => {
        if (!guild.censorship_enabled) {
            if (channel)
                return channel.watchSend("Censorship is currently disabled");
            return;
        }
        if (words.length === 0) {
            printBanList(channel);
            return;
        }
        if (!helper_js_1.default.verifyPermission(sender, channel, permissionLevel)) {
            return;
        }
        db_js_1.default.bannedWords.delete(sender.guild.id, words).then(() => {
            rebuildCensorshipList(sender.guild.id);
        });
        if (channel)
            return channel.watchSend(`These words are allowed again: ${words}`);
    });
}
function printBanList(channel) {
    if (!channel)
        return;
    db_js_1.default.bannedWords.getAll(channel.guild.id).then((rows) => {
        let banList = "";
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].word.includes(" ")) {
                banList += `'${rows[i].word}'`;
            }
            else {
                banList += `${rows[i].word}`;
            }
            if (i !== rows.length - 1) {
                banList += ", ";
            }
        }
        if (channel)
            return channel.watchSend(`Here are all the banned words: ${banList}`);
    });
}
// function enable(channel, sender, isCensoring, allowedRole) {
// 	if (!helper.hasRoleOrHigher(sender, allowedRole)) {
// 		return permissionInfract(channel);
// 	}
// 	db.guilds.setCensorship(sender.guild.id, isCensoring).then(() => {
// 		if (isCensoring) {
// 			return printBanList(channel);
// 		} else {
// 			if (channel) return channel.watchSend("All speech is permitted!");
// 		}
// 	});
// }
exports.default = {
    censorMessage,
    banWords,
    allowWords,
    containsBannedWords,
};
//# sourceMappingURL=censorship.js.map