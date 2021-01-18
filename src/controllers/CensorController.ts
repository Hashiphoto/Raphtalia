import GuildBasedController from "./GuildBasedController.js";
import MemberController from "./MemberController.js";

class CensorController extends GuildBasedController {
  toWordRegex(text) {
    return new RegExp(`(?<=^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(${text})(?![a-zA-Z0-9À-ÖØ-öø-ÿ])`, "gi");
  }

  /**
   * @param {String} text
   */
  normalize(text) {
    return text
      .toLowerCase()
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
          return [];
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

        const embed = new Discord.MessageEmbed()
          .setColor(13057084)
          .setTitle("Censorship Report")
          .setDescription(`${message.member}\n> ${censoredMessage}`);

        message.delete();

        return new MemberController(this.db, this.guild)
          .addInfractions(message.member)
          .then((feedback) => message.channel.watchSend(feedback, embed))
          .catch((error) => {
            if (error instanceof RangeError) {
              return message.channel.watchSend(error.message, embed);
            }
            throw error;
          });
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

  /**
   * @returns {Promise<Boolean>} Whether censorship is enabled for the server or not
   */
  censorshipEnabled() {
    return this.db.guilds.get(this.guild.id).then((dbGuild) => dbGuild.censorshipEnabled);
  }

  /**
   * @returns {Promise<String[]>}
   */
  getAllBannedWords() {
    return this.db.bannedWords.getAll(this.guild.id);
  }
}

export default CensorController;
