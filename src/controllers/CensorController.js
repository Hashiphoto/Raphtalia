import Discord from "discord.js";
import diacritic from "diacritic-regex";

import discordConfig from "../../config/discord.config.js";
import GuildBasedController from "./GuildBasedController.js";
import CommandParser from "../CommandParser.js";

class CensorController extends GuildBasedController {
  toWordRegex(text) {
    return new RegExp(`(?<=^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(${text})(?![a-zA-Z0-9À-ÖØ-öø-ÿ])`, "gi");
  }

  normalize(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^["'`\[\{\(\*]+/gi, "")
      .replace(/[!,\.;:\)\]\}\*`'"|\?]+$/gi, "");
  }

  /**
   * Check a message for banned words and censor it appropriately
   *
   * @param {Discord.Message} message - The message to check for censorship
   * @returns {Boolean} - True if the message was censored
   */
  censorMessage(message) {
    // Remove diacritics and non-alphanumeric characters
    const messageContent = this.normalize(message.content);

    return this.db.guilds
      .get(this.guild.id)
      .then((dbGuild) => {
        if (!dbGuild.censorshipEnabled) {
          return false;
        }

        const uniqueWords = Array.from(new Set(messageContent.split(/\s+/)));

        return this.db.bannedWords.contains(this.guild.id, uniqueWords);
      })
      .then((wordViolations) => {
        if (wordViolations.length === 0) {
          return;
        }

        let censoredMessage = message.content;

        for (const word of wordViolations) {
          censoredMessage = censoredMessage.replace(
            this.toWordRegex(word),
            "█".repeat(word.length / 2 + 1)
          );
        }

        message.delete();
        message.channel.watchSend(
          `> ${message.member} ${censoredMessage}\n*This message has been censored*`
        );
      });
  }

  deleteWords(words) {
    const normalizedWords = words.map((word) => this.normalize(word));
    return this.db.bannedWords.delete(this.guild.id, normalizedWords).then(() => normalizedWords);
  }

  insertWords(words) {
    const normalizedWords = words.map((word) => this.normalize(word));
    let guildWordPairs = normalizedWords.map((word) => [word, this.guild.id]);

    return this.db.bannedWords.insert(guildWordPairs).then(() => normalizedWords);
  }

  getAllBannedWords() {
    return this.db.bannedWords.getAll(this.guild.id);
  }
}

export default CensorController;
