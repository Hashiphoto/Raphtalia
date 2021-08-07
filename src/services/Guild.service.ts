import { Guild as DsGuild, Role as DsRole, TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import Guild from "../models/Guild";
import RaphError from "../models/RaphError";
import ScreeningQuestion from "../models/ScreeningQuestion";
import GuildRepository from "../repositories/Guild.repository";
import ScreeningQuestionRepository from "../repositories/ScreeningQuestion.repository";

@injectable()
export default class GuildService {
  public constructor(
    @inject(GuildRepository) private _guildRepository: GuildRepository,
    @inject(ScreeningQuestionRepository) private _screeningQRepo: ScreeningQuestionRepository
  ) {}

  public async getGuild(guildId: string): Promise<Guild | undefined> {
    return this._guildRepository.get(guildId);
  }

  public async getLeaderRole(guild: DsGuild): Promise<DsRole> {
    // Sort highest to lowest and get the top
    const highestHoisted = guild.roles.cache
      .filter((role) => role.hoist && role.members.size > 0)
      .sort((a, b) => b.comparePositionTo(a))
      .first();
    if (!highestHoisted) {
      throw new RaphError(Result.NotFound);
    }
    return highestHoisted;
  }

  public async setCensorship(guildId: string, enable: boolean): Promise<void> {
    await this._guildRepository.setCensorship(guildId, enable);
  }

  public async getScreeningQuestions(guildId: string): Promise<ScreeningQuestion[]> {
    return this._screeningQRepo.getScreeningQuestions(guildId);
  }

  public async addScreeningQuestion(guildId: string, question: ScreeningQuestion): Promise<void> {
    await this._screeningQRepo.insertScreeningQuestion(guildId, question);
  }

  /**
   * Returns true if the question was found and deleted successfully
   */
  public async deleteScreeningQuestion(guildId: string, questionId: number): Promise<boolean> {
    return this._screeningQRepo.deleteScreeningQuestion(guildId, questionId);
  }

  public async getOutputChannel(guild: DsGuild): Promise<TextChannel | undefined> {
    const dbGuild = await this._guildRepository.get(guild.id);
    if (!dbGuild || !dbGuild.outputChannelId) {
      return;
    }
    return (guild.channels.resolve(dbGuild.outputChannelId) as TextChannel) ?? undefined;
  }

  public async setRoleMessage(guildId: string, messageId: string): Promise<void> {
    await this._guildRepository.setRoleMessage(guildId, messageId);
  }

  public async setStoreMessage(guildId: string, messageId: string): Promise<void> {
    await this._guildRepository.setStoreMessage(guildId, messageId);
  }

  public async setBanListMessage(guildId: string, messageId: string): Promise<void> {
    await this._guildRepository.setBanListMessage(guildId, messageId);
  }
}
