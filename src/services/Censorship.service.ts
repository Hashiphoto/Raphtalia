import { Message, MessageEmbed } from "discord.js";

import { injectable } from "tsyringe";

@injectable()
export default class CensorshipService {
  public constructor() {}

  /**
   * Check a message for banned words and censor it appropriately
   */
  public async censorMessage(message: Message): Promise<boolean> {
    // TextChannel members will have member, but DMChannel messages will not
    if (!message.member) {
      return false;
    }

    // Remove diacritics and non-alphanumeric characters
    let originalContent = message.content;
    const normalizedContent = this.normalize(message.content);
    const dbGuild = await this.ec.db.guilds.get(this.ec.guild.id);

    if (!dbGuild || !dbGuild.censorshipEnabled) {
      return false;
    }

    const uniqueWords = Array.from(new Set(normalizedContent.split(/\s+/)));
    const wordViolations = await this.ec.db.bannedWords.contains(this.ec.guild.id, uniqueWords);

    if (wordViolations.length === 0) {
      return false;
    }

    for (const word of wordViolations) {
      originalContent = originalContent.replace(
        this.toWordRegex(word),
        "█".repeat(word.length / 2 + 1) // the character is kinda wide, so divide it in half
      );
    }

    const embed = new MessageEmbed()
      .setColor(13057084)
      .setTitle("Censorship Report")
      .setDescription(`${message.member.displayName}\n> ${originalContent}`);

    message.delete();

    await this.ec.memberController
      .addInfractions(message.member)
      .then((feedback) => this.ec.channelHelper.watchSend(feedback, embed))
      .catch((error) => {
        if (error instanceof RangeError) {
          return this.ec.channelHelper.watchSend(error.message, embed);
        }
        throw error;
      });
    return true;
  }

  public deleteWords(words: string[]) {
    const normalizedWords = words.map((word) => this.normalize(word));
    return this.ec.db.bannedWords
      .delete(this.ec.guild.id, normalizedWords)
      .then(() => normalizedWords);
  }

  public insertWords(words: string[]) {
    const normalizedWords = words.map((word) => this.normalize(word));
    const guildWordPairs = normalizedWords.map((word) => [word, this.ec.guild.id]);

    return this.ec.db.bannedWords.insert(guildWordPairs).then(() => normalizedWords);
  }

  /**
   * Checks whether censorship is enabled for the server or not
   */
  public async censorshipEnabled() {
    const dbGuild = await this.ec.db.guilds.get(this.ec.guild.id);
    return dbGuild && dbGuild.censorshipEnabled;
  }

  /**
   * @returns {Promise<String[]>}
   */
  public getAllBannedWords() {
    return this.ec.db.bannedWords.getAll(this.ec.guild.id);
  }

  private toWordRegex(text: string) {
    return new RegExp(`(?<=^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(${text})(?![a-zA-Z0-9À-ÖØ-öø-ÿ])`, "gi");
  }

  private normalize(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^["'`\[\{\(\*]+/gi, "")
      .replace(/[!,\.;:\)\]\}\*`'"|\?]+$/gi, "");
  }
}
