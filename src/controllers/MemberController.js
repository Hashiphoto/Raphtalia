import Discord from "discord.js";

import db from "../db/Database.js";
import discordConfig from "../../config/discord.config.js";
import RoleUtil from "../RoleUtil.js";
import GuildBasedController from "./GuildBasedController.js";
import MemberLimitError from "../structures/errors/MemberLimitError.js";
import links from "../../resources/links.js";
import dayjs from "dayjs";
import delay from "delay";

class MemberController extends GuildBasedController {
  infractionLimit = 3;

  /**
   * TODO: Remove this function and use the authority-checking like
   * Demote has
   * @param {Discord.GuildMember} sender
   * @param {Discord.GuildMember} target
   */
  hasAuthorityOver(sender, target) {
    return sender.id != target.id && sender.highestRole.comparePositionTo(target.highestRole) > 0;
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
      .then((result) => this.getInfractions(member))
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
      // TODO: Change to dead role
      if (this.hasRole(member, discordConfig().roles.exile)) {
        return this.softKick(member, `for breaking the rules while in exile`);
      } else {
        return this.demoteMember(member, response);
      }
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
   * @param {Discord.Guild} guild - The guild to check the roles for
   * @returns {Discord.Role} The Role object that is one higher than the member's current highest
   * in the hierarchy
   */
  getNextRole(member, guild) {
    var curRole = member.hoistRole;

    var higherRoles = [];
    guild.roles.forEach((role) => {
      if (role.comparePositionTo(curRole) > 0 && !role.managed && role.hoist) {
        higherRoles.push(role);
      }
    });
    if (higherRoles.length === 0) {
      return null;
    }
    higherRoles.sort(function (role1, role2) {
      return role1.position > role2.position;
    });

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
  getPreviousRole(member, guild) {
    var highestRole = member.highestRole;
    return RoleUtil.getNextLower(guild, highestRole);
  }

  /**
   * If the member is an exile, remove all hoisted roles from them. If they are not an exile, nothing happens
   *
   * @param {Discord.GuildMember} member - The guildMember to pardon
   */
  pardonMember(member) {
    return this.db.users.setInfractions(member.id, member.guild.id, 0).then(() => {
      const released = this.releaseFromExile(member);

      if (released) {
        return `${member} has been released from exile\n`;
      }

      return `${member} has been cleared of all charges\n`;
    });
  }

  releaseFromExile(member) {
    if (this.hasRole(member, discordConfig().roles.exile)) {
      this.setHoistedRole(member, discordConfig().roles.neutral);
      return true;
    }

    return false;
  }

  /**
   * Remove all hoisted roles and give the member the exile role
   *
   * @param {Discord.GuildMember} member - The guildMember to exile
   * @param {Number} duration - The duration of the exile in milliseconds
   * @returns {Promise<boolean>} - Whether the member was released from exile or not
   */
  exileMember(member, duration = null) {
    return this.setHoistedRole(member, discordConfig().roles.exile).then((result) => {
      if (duration == null) {
        return false;
      }

      return delay(duration).then(() => this.releaseFromExile(member));
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
    return member.roles.get(role.id);
  }

  /**
   * Verify that a member has the given role or higher. Ignores non-hoisted roles
   *
   * @param {*} member
   * @param {*} role
   */
  hasRoleOrHigher(member, role) {
    role = RoleUtil.convertToRole(member.guild, role);
    return member.highestRole.comparePositionTo(role) >= 0;
  }

  /**
   * Set the roles of a guildMember. All hoisted roles are removed first
   *
   * @param {Discord.GuildMember} member - The member to set the roles for
   * @param {RoleResolvable[]} role - An array of roles representing the names of the roles to give the members
   */
  async setHoistedRole(member, role) {
    let discordRole = RoleUtil.convertToRole(member.guild, role);

    let dbRole = await this.db.roles.getSingle(discordRole.id);
    if (!dbRole.unlimited && discordRole.members.size >= dbRole.memberLimit) {
      throw new MemberLimitError(
        dbRole.memberLimit,
        `Cannot assign ${member} to ${discordRole.name} ` +
          `since it already has ${discordRole.members.size}/${dbRole.memberLimit} members!`
      );
    }
    // Remove all hoisted roles and add the ones specified
    let hoistedRoles = member.roles.filter((role) => role.hoist);
    return member
      .removeRoles(hoistedRoles)
      .then(() => member.addRoles(discordRole).then(() => true))
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

    return member.addRoles(discordRoles);
  }

  /**
   * Remove all hoisted roles from one target and increase their former highest role by one
   *
   * @param {Discord.GuildMember} member - The GuildMember being promoted
   */
  promoteMember(member) {
    let nextHighest = this.getNextRole(member, member.guild);
    if (nextHighest == null) {
      return `${member} holds the highest office already`;
    }

    return this.db.roles.getSingle(nextHighest.id).then((dbRole) => {
      // If it's contested, no one can move into it
      if (dbRole.contested) {
        throw new MemberLimitError(
          dbRole.memberLimit,
          `Cannot promote ${member} to ${nextHighest.name} ` +
            `since it is currently being contested. Try again after the contest is resolved`
        );
      }

      // If it's full, but not contested, start a new contest
      if (!dbRole.unlimited && nextHighest.members.size >= dbRole.memberLimit) {
        return this.startContest(nextHighest, member.hoistRole).then(
          () =>
            `**${member} is contesting a promotion into the ${nextHighest} role!**\n` +
            `🔸 ${member} and everyone who currently holds the ${nextHighest} role can give me money to keep the role. ` +
            `Whoever gives the least amount of money by the end of the contest period will be demoted.\n` +
            `🔸 Contests are resolved at 8PM every day, if at least 24 hours have passed since the start of the contest.\n` +
            `🔸 Use the command \`Give @Raphtalia\` to pay me`
        );
      }

      // promote the target
      return this.setHoistedRole(member, nextHighest)
        .then((roleChanged) => {
          if (roleChanged) {
            this.setInfractions(member, 0);
            return `${member} has been promoted to ${nextHighest.name}!\nInfractions have been reset to 0`;
          } else {
            return `Could not promote ${member} to ${nextHighest.name}`;
          }
        })
        .catch((error) => {
          if (error instanceof MemberLimitError) {
            response += error.message;
          }
        });
    });
  }

  async demoteMember(target, response = "") {
    let nextLowest = this.getPreviousRole(target, target.guild);

    if (nextLowest == null) {
      throw new Error(`${target} can't get any lower`);
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
          response += `${target} has been demoted to **${nextLowest.name}**!\n`;
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

  startContest(contestedRole, previousRole) {
    return this.db.roles.insertRoleContest(contestedRole.id, previousRole.id, new Date());
  }
}

export default MemberController;
