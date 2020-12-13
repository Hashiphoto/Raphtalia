import Discord from "discord.js";
import GuildBasedController from "./GuildBasedController.js";
import RNumber from "../structures/RNumber.js";
import RoleContest from "../structures/RoleContest.js";
import dayjs from "dayjs";

class CurrencyController extends GuildBasedController {
  /**
   * @param {Discord.Message} message
   */
  payoutMessage(message) {
    return this.payoutInteraction(message.member, message.guild.id, message.createdAt);
  }

  /**
   * @param {Discord.Message} message
   * @param {Discord.GuildMember} member
   * @param {Boolean} undo
   */
  payoutReaction(message, member, undo) {
    return this.db.guilds.get(message.guild.id).then((dbGuild) => {
      const reacteeAmount = undo ? -dbGuild.reacteeRate : dbGuild.reacteeRate;
      if (!undo) {
        this.payoutInteraction(member, message.guild.id, message.createdAt);
      }
      return this.addCurrency(message.member, reacteeAmount);
    });
  }

  /**
   *
   * @param {Discord.GuildMember} member
   * @param {String} guildId
   * @param {Date} interactionDate
   */
  payoutInteraction(member, guildId, interactionDate) {
    return this.db.guilds.get(guildId).then(async (dbGuild) => {
      const dbUser = await this.db.users.get(member.id, guildId);
      const roleScalar = this.getRoleScalar(member);
      const timeElapsed = this.getTimeElapsedSeconds(dbUser.lastMessageDate, interactionDate);
      // If they've never sent a message before, give them full value
      const timeScalar =
        timeElapsed == null ? 1 : Math.min(1, timeElapsed / dbGuild.messageResetTime);
      const payout = dbGuild.messageRate * timeScalar * roleScalar;

      console.log(
        `${member.displayName}\n` +
          `Last interaction: ${
            dbUser.lastMessageDate ? dbUser.lastMessageDate.toLocaleString() : "never"
          }.\n` +
          `This interaction ${interactionDate.toLocaleString()}\n` +
          `Time interval: ${timeElapsed} seconds\n` +
          `Payout: rate (${dbGuild.messageRate}) * time (${timeScalar}) * role (${roleScalar}) = ${payout}\n\n`
      );

      return this.addCurrency(member, payout).then(() => {
        return this.db.users.setLastMessageDate(member.id, guildId, interactionDate);
      });
    });
  }

  /**
   * @param {Discord.GuildMember} member
   */
  getRoleScalar(member) {
    const role = member.roles.hoist;
    if (!role) {
      return 0;
    }

    const hoistRoles = member.guild.roles.cache
      .filter((r) => r.hoist)
      .sort((a, b) => a.calculatedPosition - b.calculatedPosition)
      .array();

    const hoistedPosition = hoistRoles.findIndex((r) => r.id === role.id) + 1;

    // Linear scaling (0.0 - 1.0)
    const roleScale = hoistedPosition / hoistRoles.length;
    // Bump scale to (1.0 - 2.0)
    return 1 + roleScale;
  }

  /**
   * @param {Date} startDate
   * @param {Date} finishDate
   * @returns {Number}
   */
  getTimeElapsedSeconds(startDate, finishDate) {
    if (!startDate || !finishDate) {
      return null;
    }
    const msElapsed = finishDate - startDate;
    return Math.floor(msElapsed / 1000);
  }

  addCurrency(member, amount = 1) {
    return this.db.users.incrementCurrency(member.id, member.guild.id, amount);
  }

  transferCurrency(fromMember, toMember, amount) {
    return this.db.users
      .incrementCurrency(fromMember.id, this.guild.id, -amount)
      .then(this.db.users.incrementCurrency(toMember.id, this.guild.id, amount));
  }

  getCurrency(member) {
    return this.db.users.get(member.id, member.guild.id).then((dbUser) => {
      return dbUser.currency;
    });
  }

  /**
   * @param {Discord.Role} role
   * @param {Discord.GuildMember} member
   * @param {Number} amount
   * @returns {Promise<RoleContest|null>}
   */
  bidOnRoleContest(role, member, amount) {
    return this.db.roles.findRoleContest(role.id, member.id).then((roleContest) => {
      if (!roleContest) {
        return null;
      }

      return this.db.roles
        .insertContestBid(roleContest.id, member.id, amount)
        .then(() => roleContest);
    });
  }
}

export default CurrencyController;
