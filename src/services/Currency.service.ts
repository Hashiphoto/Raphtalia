import { GuildMember, Message } from "discord.js";
import { inject, injectable } from "tsyringe";
import { Env } from "../enums/Environment";
import GuildRepository from "../repositories/Guild.repository";
import UserRepository from "../repositories/User.repository";

@injectable()
export default class CurrencyService {
  public constructor(
    @inject(UserRepository) private _userRepository: UserRepository,
    @inject(GuildRepository) private _guildRepository: GuildRepository
  ) {}

  public async payoutMessageAuthor(message: Message): Promise<void> {
    if (!message.member) {
      return;
    }
    await this.payoutInteraction(message.member, message.createdAt);
  }

  public async payoutReaction(member: GuildMember, message: Message, undo = false): Promise<void> {
    if (!message.member) {
      return;
    }
    const guild = await this._guildRepository.get(member.guild.id);
    if (!guild) {
      return;
    }

    const reacteeAmount = undo ? -guild.reacteeRate : guild.reacteeRate;

    if (!undo) {
      this.payoutInteraction(member, message.createdAt);
    }

    await this.addCurrency(message.member, reacteeAmount);
  }

  public async payoutInteraction(member: GuildMember, interactionDate: Date): Promise<void> {
    const guild = await this._guildRepository.get(member.guild.id);
    if (!guild) {
      return;
    }

    const dbUser = await this._userRepository.get(member.id, member.guild.id);
    const roleScalar = this.getRoleScalar(member);
    const timeElapsed = this.getTimeElapsedSeconds(dbUser.lastMessageDate, interactionDate);

    // If they've never sent a message before, give them full value
    const timeScalar = timeElapsed == null ? 1 : Math.min(1, timeElapsed / guild.messageResetTime);
    const payout = guild.messageRate * timeScalar * roleScalar;

    if (process.env.NODE_ENV === Env.Dev) {
      console.log(
        `${member.displayName}\n` +
          `Last interaction: ${
            dbUser.lastMessageDate ? dbUser.lastMessageDate.toLocaleString() : "never"
          }.\n` +
          `This interaction ${interactionDate.toLocaleString()}\n` +
          `Time interval: ${timeElapsed} seconds\n` +
          `Payout: rate (${guild.messageRate}) * time (${timeScalar}) * role (${roleScalar}) = ${payout}\n\n`
      );
    }

    await this.addCurrency(member, payout);
    await this._userRepository.setLastMessageDate(member.id, member.guild.id, interactionDate);
  }

  /**
   * 1.0 for the base role, scaling up to 2.0 for the highest role
   */
  public getRoleScalar(member: GuildMember): number {
    const role = member.roles.hoist;
    if (!role) {
      return 0;
    }

    const hoistRoles = [
      ...member.guild.roles.cache
        .filter((r) => r.hoist)
        .sort((a, b) => a.comparePositionTo(b))
        .values(),
    ];

    const hoistedPosition = hoistRoles.findIndex((r) => r.id === role.id) + 1;

    // Linear scaling (0.0 - 1.0)
    const roleScale = hoistedPosition / hoistRoles.length;
    // Bump scale to (1.0 - 2.0)
    return 1 + roleScale;
  }

  /**
   * Get the difference between two dates
   * TODO: Move this to a utility class?
   */
  public getTimeElapsedSeconds(startDate: Date, finishDate: Date): number | undefined {
    if (!startDate || !finishDate) {
      return;
    }
    const msElapsed = finishDate.getTime() - startDate.getTime();
    return Math.floor(msElapsed / 1000);
  }

  public async addCurrency(member: GuildMember, amount: number): Promise<void> {
    await this._userRepository.incrementCurrency(member.id, member.guild.id, amount);
  }

  public async transferCurrency(
    fromMember: GuildMember,
    toMember: GuildMember,
    amount: number
  ): Promise<void> {
    await this._userRepository
      .incrementCurrency(fromMember.id, fromMember.guild.id, -amount)
      .then(() => {
        this._userRepository.incrementCurrency(toMember.id, fromMember.guild.id, amount);
      });
  }

  public async getCurrency(member: GuildMember): Promise<number> {
    return this._userRepository.get(member.id, member.guild.id).then((dbUser) => {
      return dbUser.currency;
    });
  }
}
