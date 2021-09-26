import { Guild as DsGuild, Message, MessageEmbed, TextChannel } from "discord.js";
import { delay, inject, injectable } from "tsyringe";
import BannedWordsRepository from "../repositories/BannedWords.repository";
import GuildRepository from "../repositories/Guild.repository";
import ChannelService from "./Channel.service";
import MemberService from "./Member.service";

@injectable()
export default class CensorshipService {
  public constructor(
    @inject(GuildRepository) private _guildRepository: GuildRepository,
    @inject(BannedWordsRepository) private _bannedWordsRepo: BannedWordsRepository,
    @inject(ChannelService) private _channelService: ChannelService,
    @inject(delay(() => MemberService)) private _memberService: MemberService
  ) {}

  /**
   * Check a message for banned words and censor it appropriately
   *
   * @returns True if the message was censored
   */
  public async censorMessage(message: Message): Promise<boolean> {
    // TextChannel members will have member, but DMChannel messages will not
    if (!message.member || !message.guild) {
      return false;
    }

    const channel = message.channel;
    const guild = message.guild;

    // Remove diacritics and non-alphanumeric characters
    let originalContent = message.content;
    const normalizedContent = this.normalize(message.content);
    const dbGuild = await this._guildRepository.get(guild.id);

    if (!dbGuild || !dbGuild.censorshipEnabled) {
      return false;
    }

    const uniqueWords = Array.from(new Set(normalizedContent.split(/\s+/)));
    const wordViolations = await this._bannedWordsRepo.contains(guild.id, uniqueWords);

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

    const infractionFeedback = await this._memberService.addInfractions(message.member);
    await this._channelService.watchSend(channel as TextChannel, {
      content: infractionFeedback,
      embeds: [embed],
    });

    return true;
  }

  public async deleteWords(guild: DsGuild, words: string[]): Promise<void> {
    const normalizedWords = words.map((word) => this.normalize(word));
    await this._bannedWordsRepo.delete(guild.id, normalizedWords).then(() => normalizedWords);
  }

  public async insertWords(guild: DsGuild, words: string[]): Promise<void> {
    const normalizedWords = words.map((word) => this.normalize(word));
    const guildWordPairs = normalizedWords.map((word) => [word, guild.id]);

    await this._bannedWordsRepo.insert(guildWordPairs).then(() => normalizedWords);
  }

  /**
   * Checks whether censorship is enabled for the server or not
   */
  public async isCensorshipEnabled(guild: DsGuild): Promise<boolean> {
    const dbGuild = await this._guildRepository.get(guild.id);
    return dbGuild !== undefined && dbGuild.censorshipEnabled;
  }

  public getAllBannedWords(guild: DsGuild): Promise<string[]> {
    return this._bannedWordsRepo.getAll(guild.id);
  }

  private toWordRegex(text: string) {
    return new RegExp(`(?<=^|[^a-zA-Z0-9À-ÖØ-öø-ÿ])(${text})(?![a-zA-Z0-9À-ÖØ-öø-ÿ])`, "gi");
  }

  /**
   * Lower case, removes all special characters and accents
   */
  private normalize(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^["'`[{(*]+/gi, "")
      .replace(/[!,.;:)\]}*`'"|?]+$/gi, "");
  }
}
