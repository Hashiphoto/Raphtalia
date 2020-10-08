import dayjs from "dayjs";
import Discord from "discord.js";
import RNumber from "../structures/RNumber.js";
import RoleContest from "../structures/RoleContest.js";
import GuildBasedController from "./GuildBasedController.js";

class CurrencyController extends GuildBasedController {
  /**
   * @param {Discord.Message} message
   */
  payoutMessage(message) {
    return this.db.guilds.get(message.guild.id).then(async (dbGuild) => {
      const dbUser = await this.db.users.get(message.member.id, message.guild.id);
      const roleScalar = this.getRoleScalar(message.member);
      const timeElapsed = this.getTimeElapsedSeconds(dbUser.lastMessageDate, message.createdAt);
      // console.log(
      //   `Last message sent at ${
      //     dbUser.lastMessageDate ? dbUser.lastMessageDate.toLocaleString() : "never"
      //   }. This message sent at ${message.createdAt.toLocaleString()}\n` +
      //     `Time interval: ${timeElapsed} seconds`
      // );
      // If they've never sent a message before, give them full value
      const timeScalar =
        timeElapsed == null ? 1 : Math.min(1, timeElapsed / dbGuild.messageResetTime);
      const payout = dbGuild.messageRate * timeScalar * roleScalar;

      return this.addCurrency(message.member, payout).then(() => {
        return this.db.users.setLastMessageDate(
          message.member.id,
          message.guild.id,
          message.createdAt
        );
      });
    });
  }

  /**
   * @param {Discord.Message} message
   * @param {Discord.GuildMember} member
   * @param {Boolean} undo
   */
  payoutReaction(message, member, undo) {
    return this.db.guilds.get(message.guild.id).then((dbGuild) => {
      const reactorAmount = undo ? -dbGuild.reactorRate : dbGuild.reactorRate;
      const reacteeAmount = undo ? -dbGuild.reacteeRate : dbGuild.reacteeRate;

      return this.addCurrency(member, reactorAmount).then(
        this.addCurrency(message.member, reacteeAmount)
      );
    });
  }

  /**
   * @param {Discord.GuildMember} member
   */
  getRoleScalar(member) {
    const role = member.hoistRole;
    if (!role) {
      return 0;
    }

    const hoistRoles = member.guild.roles
      .filter((r) => r.hoist)
      .sort((a, b) => a.calculatedPosition - b.calculatedPosition)
      .array();

    const hoistedPosition = hoistRoles.findIndex((r) => r.id === role.id) + 1;

    // Linear scaling from 0 to 1
    // To flatten the distance between the top and bottom, divide the output by some number
    // and add a coefficient to make the range comparable to previous values
    return hoistedPosition / hoistRoles.length;
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
