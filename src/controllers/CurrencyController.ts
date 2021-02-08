import GuildBasedController from "./Controller";
import { GuildMember } from "discord.js";

export default class CurrencyController extends GuildBasedController {
  public async payoutMessage() {
    if (!this.ec.message.member) {
      return;
    }
    return this.payoutInteraction(this.ec.message.member, this.ec.message.createdAt);
  }

  public async payoutReaction(member: GuildMember, undo: boolean = false) {
    if (!this.ec.message.member) {
      return;
    }
    const dbGuild = await this.ec.db.guilds.get(this.ec.guild.id);
    if (!dbGuild) {
      return;
    }

    const reacteeAmount = undo ? -dbGuild.reacteeRate : dbGuild.reacteeRate;

    if (!undo) {
      this.payoutInteraction(member, this.ec.message.createdAt);
    }

    return this.addCurrency(this.ec.message.member, reacteeAmount);
  }

  public async payoutInteraction(member: GuildMember, interactionDate: Date) {
    const dbGuild = await this.ec.db.guilds.get(this.ec.guild.id);
    if (!dbGuild) {
      return;
    }

    const dbUser = await this.ec.db.users.get(member.id, this.ec.guild.id);
    const roleScalar = this.getRoleScalar(member);
    const timeElapsed = this.getTimeElapsedSeconds(dbUser.lastMessageDate, interactionDate);

    // If they've never sent a message before, give them full value
    const timeScalar =
      timeElapsed == null ? 1 : Math.min(1, timeElapsed / dbGuild.messageResetTime);
    const payout = dbGuild.messageRate * timeScalar * roleScalar;

    // console.log(
    //   `${member.displayName}\n` +
    //     `Last interaction: ${
    //       dbUser.lastMessageDate ? dbUser.lastMessageDate.toLocaleString() : "never"
    //     }.\n` +
    //     `This interaction ${interactionDate.toLocaleString()}\n` +
    //     `Time interval: ${timeElapsed} seconds\n` +
    //     `Payout: rate (${dbGuild.messageRate}) * time (${timeScalar}) * role (${roleScalar}) = ${payout}\n\n`
    // );

    return this.addCurrency(member, payout).then(() => {
      return this.ec.db.users.setLastMessageDate(member.id, this.ec.guild.id, interactionDate);
    });
  }

  /**
   * 1.0 for the base role, scaling up to 2.0 for the highest role
   */
  public getRoleScalar(member: GuildMember) {
    const role = member.roles.hoist;
    if (!role) {
      return 0;
    }

    const hoistRoles = member.guild.roles.cache
      .filter((r) => r.hoist)
      .sort((a, b) => a.comparePositionTo(b))
      .array();

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
  public getTimeElapsedSeconds(startDate: Date, finishDate: Date) {
    if (!startDate || !finishDate) {
      return null;
    }
    const msElapsed = finishDate.getTime() - startDate.getTime();
    return Math.floor(msElapsed / 1000);
  }

  public addCurrency(member: GuildMember, amount = 1) {
    return this.ec.db.users.incrementCurrency(member.id, member.guild.id, amount);
  }

  public transferCurrency(
    fromMember: GuildMember,
    toMember: GuildMember,
    amount: number
  ): Promise<void> {
    return this.ec.db.users.incrementCurrency(fromMember.id, this.ec.guild.id, -amount).then(() => {
      this.ec.db.users.incrementCurrency(toMember.id, this.ec.guild.id, amount);
    });
  }

  public getCurrency(member: GuildMember) {
    return this.ec.db.users.get(member.id, member.guild.id).then((dbUser) => {
      return dbUser.currency;
    });
  }
}
