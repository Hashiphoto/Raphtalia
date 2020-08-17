import Discord from "discord.js";
import diacritic from "diacritic-regex";

import discordConfig from "../../config/discord.config.js";
import { hasRole, hasRoleOrHigher } from "./RoleController.js";
import { addInfractions } from "./MemberController.js";
import GuildBasedController from "./GuildBasedController.js";

class CensorController extends GuildBasedController {
  async rebuildCensorshipList() {
    let bannedWords = await this.db.bannedWords.getAll(this.guild.id);
    let regexString = "(^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(";
    for (let i = 0; i < bannedWords.length; i++) {
      // Last word
      if (i === bannedWords.length - 1) {
        regexString += diacritic.toString()(bannedWords[i].word);
      } else {
        regexString += diacritic.toString()(bannedWords[i].word) + "|";
      }
    }
    regexString += ")(?![a-zA-Z0-9À-ÖØ-öø-ÿ])";

    return this.db.guilds.updateCensorshipRegex(this.guild.id, regexString);
  }

  /**
   * Check a message for banned words and censor it appropriately
   *
   * @param {Discord.Message} message - The message to check for censorship
   * @returns {Boolean} - True if the message was censored
   */
  censorMessage(message) {
    return this.db.guilds.get(message.guild.id).then((guild) => {
      if (!guild.censorship_enabled) {
        return false;
      }

      const sender = message.guild.members.get(message.author.id);

      // The supreme dictator is not censored. Also, immigrants are handled by the Arrive command
      if (
        hasRole(sender, discordConfig().roles.leader) ||
        hasRole(sender, discordConfig().roles.immigrant)
      ) {
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
            description: `What ${
              sender.displayName
            } ***meant*** to say is \n> ${message.content.replace(
              bannedRegex,
              "██████"
            )}`,
            color: 13057084,
            timestamp: new Date(),
          },
        });
      }

      addInfractions(
        sender,
        message.channel,
        1,
        `This infraction has been recorded`
      );
      return true;
    });
  }

  deleteWords(words) {
    return this.db.bannedWords.delete(this.guild.id, words);
  }

  insertWords(words) {
    let values = words.map((word) => [word, this.guild.id]);
    return this.db.bannedWords.insert(guildWordPairs);
  }

  getAllBannedWords() {
    return this.db.bannedWords
      .getAll(this.guild.id)
      .then((rows) => rows.map((r) => r.word));
  }
}

export default CensorController;

// TODO: Fix dependencies on this method
function containsBannedWords(guildId, text) {
  return this.db.guilds.get(guildId).then((guild) => {
    if (!guild.censorship_enabled) {
      return false;
    }

    return text.match(guild.censor_regex) != null;
  });
}
