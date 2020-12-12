import Discord from "discord.js";

import db from "../db/Database.js";
import RoleUtil from "../RoleUtil.js";
import GuildBasedController from "./GuildBasedController.js";
import MemberLimitError from "../structures/errors/MemberLimitError.js";
import links from "../../resources/links.js";
import delay from "delay";
import RNumber from "../structures/RNumber.js";
import dayjs from "dayjs";

class MemberController extends GuildBasedController {
  infractionLimit = 3;

  /**
   * TODO: Remove this function and use the authority-checking like
   * Demote has
   * @param {Discord.GuildMember} sender
   * @param {Discord.GuildMember} target
   */
  hasAuthorityOver(sender, target) {
    return (
      sender.id != target.id && sender.roles.highest.comparePositionTo(target.roles.highest) > 0
    );
  }

  /**
   * Increases the infraction count for a given member. If they exceed the this.infractionLimit, the member
   * is exiled
   *
   * @param {Discord.GuildMember} member - The member to infract
   * @param {Number} amount - The amount of infractions to increase by (default is 1)
   * @returns {String}
   */
  addInfractions(member, amount = 1) {
    return this.db.users
      .incrementInfractions(member.id, member.guild.id, amount)
      .then(() => this.getInfractions(member))
      .then((count) => {
        return this.checkInfractionCount(member, count);
      });
  }

  /**
   * Set the absolute infraction count for a given member
   *
   * @param {Discord.GuildMember} member - The member to set the infractions for
   * @param {number} amount - The number of infractions they will have
   */
  setInfractions(member, amount) {
    return this.db.users
      .setInfractions(member.id, member.guild.id, amount)
      .then(this.getInfractions(member))
      .then((count) => {
        return this.checkInfractionCount(member, count);
      });
  }

  /**
   * Print out the number of infractions a member has incurred in the given channel
   *
   * @param {Discord.GuildMember} member - The member whose fractions are reported
   * @param {Discord.TextChannel} channel - The channel to send messages in
   * @param {String} pretext - Text to prepend at the beginning of the infraction message
   * @returns {Number}
   */
  getInfractions(member) {
    return this.db.users.get(member.id, this.guild.id).then((user) => {
      return user.infractions;
    });
  }

  /**
   * Check if infractions is over the limit, then exile the member if so.
   * If they are already in exile, then softkick them.
   *
   * @param {Discord.TextChannel} channel - The channel to send messages in
   * @param {Discord.GuildMember} member - The GuildMember to check infractions for
   * @param {number} count - The number of infractions accrued
   */
  async checkInfractionCount(member, count = null) {
    if (count == null) {
      let user = await db.users.get(member.id, member.guild.id);
      count = user.infractions;
    }
    let response = `${member} has incurred ${count} infractions\n`;
    if (count >= this.infractionLimit) {
      return this.demoteMember(member, response);
    }
    return Promise.resolve(response);
  }

  /**
   * @param {Discord.GuildMember} member - The member to softkick
   * @param {String} reason - The message to send to the kicked member
   */
  softKick(member, reason = null, kicker = null) {
    let inviteChannel = member.guild.systemChannel;
    return inviteChannel
      .createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
      .then((invite) =>
        member
          .send(
            `You were kicked from ${this.guild.name} ${kicker ? `by ${kicker.username}` : ``} ${
              reason ?? ""
            }` +
              "\n" +
              invite.toString()
          )
          .then(() => member.kick())
      )
      .then(() => {
        let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
        let kickGif = links.gifs.kicks[randInt];

        return `:wave: ${member.displayName} has been kicked and invited back\n${kickGif}`;
      })
      .catch((error) => {
        if (error.name === "DiscordAPIError" && error.message === "Missing Permissions") {
          return `I don't have high enough permissions to kick ${member.displayName}`;
        }
        throw error;
      });
  }

  /**
   * Get the next highest hoisted role for a given member
   *
   * @param {Discord.GuildMember} member - The guildMember to check the highest role for
   * @returns {Discord.Role} The Role object that is one higher than the member's current highest
   * in the hierarchy
   */
  getNextRole(member) {
    var curRole = member.roles.hoist ?? this.guild.roles.cache.find((r) => r.name === "@everyone");

    var higherRoles = this.guild.roles.cache
      .filter((role) => role.comparePositionTo(curRole) > 0 && role.hoist)
      .array()
      .sort((role1, role2) => {
        return role1.position - role2.position;
      });

    if (higherRoles.length === 0) {
      return null;
    }

    return higherRoles[0];
  }

  /**
   * Get the next lowest hoisted role for a given member
   *
   * @param {Discord.GuildMember} member - The guildMember to check the lowest role for
   * @param {Discord.Guild} guild - The guild to check the roles for
   * @returns {Discord.Role} The Role object that is one lower than the member's current highest
   * in the hierarchy
   */
  getPreviousRole(member) {
    var curRole = member.roles.hoist;
    if (!curRole) {
      return null;
    }

    var lowerRoles = this.guild.roles.cache
      .filter((role) => role.comparePositionTo(curRole) < 0 && role.hoist)
      .array()
      .sort((role1, role2) => {
        return role1.position - role2.position;
      });

    if (lowerRoles.length === 0) {
      return null;
    }

    return lowerRoles[lowerRoles.length - 1];
  }

  /**
   * If the member is an exile, remove all hoisted roles from them. If they are not an exile, nothing happens
   *
   * @param {Discord.GuildMember} member - The guildMember to pardon
   */
  pardonMember(member) {
    return this.db.users.setInfractions(member.id, member.guild.id, 0).then(() => {
      const response = `${member}'s infractions have been reset\n`;
      const exileRole = this.guild.roles.cache.find((r) => r.name === "Exile");
      const inExile = member.roles.cache.has(exileRole.id);
      if (inExile) {
        return member.roles
          .remove(exileRole)
          .then(() => response + `${member}'s exile has ended\n`);
      }

      return response;
    });
  }

  /**
   * Remove all hoisted roles and give the member the exile role
   *
   * @param {Discord.GuildMember} member - The guildMember to exile
   * @param {Number} duration - The duration of the exile in milliseconds
   * @returns {Promise<boolean>} - Whether the member was released from exile or not
   */
  exileMember(member, duration) {
    const exileRole = this.guild.roles.cache.find((r) => r.name === "Exile");
    return member.roles.add(exileRole).then(() => {
      return delay(duration).then(() => member.roles.remove(exileRole));
    });
  }

  /**
   * Check if a member has a given role specified by role id
   *
   * @param {Discord.GuildMember} member - The guildMember to check roles
   * @param {RoleResolvable} role - The id of the role to check that member has
   * @returns {Boolean} - True if the member has that role
   */
  hasRole(member, role) {
    role = RoleUtil.convertToRole(member.guild, role);
    return member.roles.cache.get(role.id);
  }

  /**
   * Verify that a member has the given role or higher. Ignores non-hoisted roles
   *
   * @param {*} member
   * @param {*} role
   */
  hasRoleOrHigher(member, role) {
    role = RoleUtil.convertToRole(member.guild, role);
    return member.roles.highest.comparePositionTo(role) >= 0;
  }

  /**
   * Set the roles of a guildMember. All hoisted roles are removed first
   *
   * @param {Discord.GuildMember} member - The member to set the roles for
   * @param {RoleResolvable[]} role - An array of roles representing the names of the roles to give the members
   * @param {Boolean} clearAllRoles - True to remove all hoisted and non-hoisted roles first
   */
  async setHoistedRole(member, role, clearAllRoles = false) {
    let discordRole = RoleUtil.convertToRole(member.guild, role);

    // Remove all hoisted roles and add the ones specified
    let currentRoles = clearAllRoles
      ? member.roles.cache
      : member.roles.cache.filter((role) => role.hoist);
    return member.roles
      .remove(currentRoles)
      .then(() => member.roles.add(discordRole).then(() => true))
      .catch(() => {
        console.error("Could not change roles for " + member.displayName);
        return false;
      });
  }

  /**
   * @param {Discord.GuildMember} member
   * @param {RoleResolvable[]} roles
   */
  addRoles(member, roles) {
    var discordRoles = RoleUtil.parseRoles(member.guild, roles);

    return member.roles.add(discordRoles);
  }

  /**
   * @param {Discord.GuildMember} member
   * @returns {Promise<{Boolean, Discord.Role}>} The next role to promote to, or null if a contest was started
   * @throws {MemberLimitError}
   * @throws {RangeError}
   */
  nextRoleAvailable(member) {
    let nextRole = this.getNextRole(member, this.guild);
    if (nextRole == null) {
      return new Promise(() => {
        throw new RangeError(`${member} holds the highest office already\n`);
      });
    }

    return this.db.roles.getSingle(nextRole.id).then((dbRole) => {
      // If it's contested, no one can move into it
      if (dbRole.contested) {
        throw new MemberLimitError(
          dbRole.memberLimit,
          `Cannot promote ${member} to ${nextRole.name} ` +
            `since it is currently being contested. Try again after the contest is resolved\n`
        );
      }

      // If it's full, but not contested, start a new contest
      if (!dbRole.unlimited && nextRole.members.size >= dbRole.memberLimit) {
        return this.startContest(nextRole, member.roles.hoist, member).then(() => {
          // TODO: Turn this object into a type
          return { available: false, role: nextRole };
        });
      }

      return { available: true, role: nextRole };
    });
  }

  /**
   * Remove all hoisted roles from one target and increase their former highest role by one
   *
   * @param {Discord.GuildMember} member - The GuildMember being promoted
   * @param {Discord.Role} role - If left empty, the next highest role will be used
   * @throws {RangeError}
   */
  promoteMember(member, role = null) {
    if (!role) {
      role = this.getNextRole(member, member.guild);
      if (role == null) {
        throw new RangeError(`${member} holds the highest office already\n`);
      }
    }

    return this.setHoistedRole(member, role).then((roleChanged) => {
      if (roleChanged) {
        this.setInfractions(member, 0);
        return `${member} has been promoted to **${role.name}**!\nInfractions have been reset\n`;
      } else {
        return `Could not promote ${member} to ${role.name}\n`;
      }
    });
  }

  /**
   * @param {Discord.GuildMember} target
   * @param {String} response
   */
  async demoteMember(target, response = "") {
    let nextLowest = this.getPreviousRole(target, target.guild);

    if (nextLowest == null) {
      throw new RangeError(`${response}\n${target} can't get any lower\n`);
    }

    this.setInfractions(target, 0);

    // TODO: Figure out if exile should have to be a separate command only
    // if (nextLowest.id == discordConfig().roles.exile) {
    //   exileMember(target, channel, dayjs().add(1, "day"));
    //   return;
    // }

    let changed = false;
    while (!changed) {
      await this.setHoistedRole(target, nextLowest)
        .then(() => {
          changed = true;
          response += `${target} has been demoted to **${nextLowest.name}**!\nInfractions have been reset\n`;
        })
        .catch((error) => {
          if (error instanceof MemberLimitError) {
            response += error.message;
            nextLowest = RoleUtil.getNextLower(nextLowest);
          }
        });
    }

    return Promise.resolve(response);
  }

  /**
   * @param {Discord.Role} contestedRole
   * @param {Discord.Role} previousRole
   * @param {Discord.GuildMember} member
   */
  startContest(contestedRole, previousRole, member) {
    return this.db.roles.insertRoleContest(
      contestedRole.id,
      previousRole.id,
      member.id,
      new Date()
    );
  }

  resolveRoleContests(force = false) {
    return this.db.roles.getAllContests(this.guild.id).then((rawContests) => {
      const contests = rawContests.filter((contest) => {
        return force ? true : dayjs(contest.startDate).add(24, "hour").isBefore(dayjs());
      });
      if (contests.length === 0) {
        return;
      }
      const promises = contests.map((contest) => {
        const role = RoleUtil.convertToRole(this.guild, contest.roleId);
        const initiator = this.guild.members.cache.get(contest.initiatorId);
        const participants = role.members.array();
        participants.push(initiator);

        const loserBid = contest.getLoser(participants);

        return this.punishContestLoser(initiator, loserBid, role)
          .then((feedback) => {
            this.db.roles.deleteContest(contest.id);
            return feedback;
          })
          .then(
            (feedback) =>
              `**The contest for the ${role} role is over!**\n` +
              `The loser is ${loserBid.member} with a measly bid of ${RNumber.formatDollar(
                loserBid.amount
              )}!\n${feedback}\n\n`
          );
      });

      return Promise.all(promises);
    });
  }

  /**
   * @param {Discord.GuildMember} initiator
   * @param {RoleContestBid} loserBid
   * @param {Discord.Role} role
   */
  punishContestLoser(initiator, loserBid, role) {
    // If the initiator loses, we can just demote him
    if (loserBid.userId === initiator.id) {
      return this.demoteMember(initiator);
    }
    // Initiator promoted to role. Loser demoted
    else {
      return this.promoteMember(initiator, role).then((feedback) =>
        this.demoteMember(loserBid.member, feedback)
      );
    }
  }
}

export default MemberController;
