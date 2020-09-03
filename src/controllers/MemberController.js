import Discord from "discord.js";

import db from "../db/Database.js";
import discordConfig from "../../config/discord.config.js";
import RoleUtil from "./RoleUtil.js";
import GuildBasedController from "./GuildBasedController.js";
import MemberLimitError from "../structures/MemberLimitError.js";

class MemberController extends GuildBasedController {
  infractionLimit = 3;

  /**
   * @param {Discord.GuildMember} sender
   * @param {Discord.GuildMember} target
   */
  static hasAuthorityOver(sender, target) {
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
        return this.softKick(
          member,
          `Doing something illegal while under exile?` +
            ` Come back when you're feeling more agreeable.`
        );
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
  softKick(member, reason = "") {
    let inviteChannel = member.guild.systemChannel;
    inviteChannel
      .createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
      .then((invite) => {
        return member.send(reason + "\n" + invite.toString());
      })
      .then(member.kick())
      .then(() => {
        let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
        let kickGif = links.gifs.kicks[randInt];
        if (channel)
          return channel.watchSend(
            `:wave: ${member.displayName} has been kicked and invited back\n${kickGif}`
          );
      })
      .catch((e) => {
        console.error(e);
      });
  }

  exileTimers = new Map();

  /**
   * Get the next highest hoisted role for a given member
   *
   * @param {Discord.GuildMember} member - The guildMember to check the highest role for
   * @param {Discord.Guild} guild - The guild to check the roles for
   * @returns {Discord.Role} The Role object that is one higher than the member's current highest
   * in the hierarchy
   */
  getNextRole(member, guild) {
    var curRole = member.highestRole;

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
    db.users.setInfractions(member.id, member.guild.id, 0);

    if (RoleUtil.hasRole(member, discordConfig().roles.exile)) {
      this.clearExileTimer(member);
      this.setHoistedRole(member, discordConfig().roles.neutral);
      return Promise.resolve(`${member} has been released from exile`);
    } else {
      return Promise.resolve(`${member} has been cleared of all charges`);
    }
  }

  /**
   * Remove all hoisted roles and give the member the exile role
   *
   * @param {Discord.GuildMember} member - The guildMember to exile
   * @param {dayjs} releaseDate - The dayjs object representing when the exile will end
   */
  exileMember(member, releaseDate = null) {
    setHoistedRole(member, discordConfig().roles.exile);

    if (releaseDate != null) {
      let duration = releaseDate.diff(dayjs());
      if (duration > 0x7fffffff) {
        duration = 0x7fffffff;
        releaseDate = dayjs().add(duration, "ms");
      }
      let timerId = setTimeout(() => {
        pardonMember(member, channel);
      }, duration);
      clearExileTimer(member);
      exileTimers.set(member.id, timerId);
    }
  }

  /**
   *
   * @param {Discord.GuildMember} member - The member to clear exile timer for, if it exists
   */
  clearExileTimer(member) {
    if (exileTimers.has(member.id)) {
      clearTimeout(exileTimers.get(member.id));
      exileTimers.delete(member.id);
    }
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
    if (dbRole.member_limit >= 0 && discordRole.members.size >= dbRole.member_limit) {
      throw new MemberLimitError(
        dbRole.member_limit,
        `Cannot assign ${member} to ${discordRole.name} ` +
          `since it already has ${discordRole.members.size}/${dbRole.member_limit} members!`
      );
    }
    // Remove all hoisted roles and add the ones specified
    let hoistedRoles = member.roles.filter((role) => role.hoist);
    return member
      .removeRoles(hoistedRoles)
      .then(() => {
        member.addRoles(discordRole);
        return [true, dbRole.member_limit];
      })
      .catch(() => {
        console.error("Could not change roles for " + member.displayName);
        return [false, dbRole.member_limit];
      });
  }

  /**
   * @param {Discord.GuildMember} member
   * @param {RoleResolvable[]} roles
   */
  addRoles(member, roles) {
    var discordRoles = parseRoles(member.guild, roles);

    return member.addRoles(discordRoles);
  }

  /**
   * Remove all hoisted roles from one target and increase their former highest role by one
   *
   * @param {Discord.TextChannel} channel - The channel to send messages in
   * @param {Discord.GuildMember} sender - The GuildMember doing the promotion
   * @param {Discord.GuildMember} target - The GuildMember being promoted
   */
  promoteMember(channel, sender, target) {
    let nextHighest = getNextRole(target, target.guild);

    // Disallow self-promotion
    if (sender != null) {
      if (sender.id === target.id) {
        addInfractions(sender, channel, 1, links.gifs.bernieNo);
        return;
      }
      // Ensure the target's next highest role is not higher than the sender's
      if (sender.highestRole.comparePositionTo(nextHighest) < 0) {
        addInfractions(sender, channel, 1, "You can't promote above your own role");
        return;
      }
    }

    if (hasRole(target, discordConfig().roles.exile)) {
      clearExileTimer(target);
    }

    if (nextHighest == null) {
      if (channel) channel.watchSend(`${target} holds the highest office already`);
      return;
    }

    setInfractions(target, null, 0, null);

    // promote the target
    setHoistedRole(target, nextHighest).then(([roleChanged, memberLimit]) => {
      if (roleChanged) {
        channel.watchSend(`${target} has been promoted to ${nextHighest.name}!`);
      } else {
        channel.watchSend(
          `Cannot promote because ${nextHighest.name} already has ${nextHighest.members.size}/${memberLimit} members!`
        );
      }
    });
  }

  async demoteMember(target, response = "") {
    if (this.hasRole(target, discordConfig().roles.exile)) {
      clearExileTimer(target);
    }

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
          response += `${target} has been demoted to **${nextLowest.name}**!`;
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
   * Remove all hoisted roles from one target and decrease their former highest role by one
   *
   * @param {Discord.TextChannel} channel - The channel to send messages in
   * @param {Discord.GuildMember} sender - The GuildMember doing the promotion
   * @param {Discord.GuildMember} target - The GuildMember being promoted
   */
  // oldDemoteMember(channel, sender, target) {
  //   // Ensure the sender has a higher rank than the target
  //   if (sender != null) {
  //     if (sender.highestRole.comparePositionTo(target.highestRole) < 0) {
  //       addInfractions(sender, channel, 1, `${target} holds a higher rank than you!`);
  //       return;
  //     }
  //     if (
  //       sender.id !== target.id &&
  //       sender.highestRole.comparePositionTo(target.highestRole) == 0
  //     ) {
  //       addInfractions(sender, channel, 1, `${target} holds an equal rank with you`);
  //       return;
  //     }
  //   }

  //   if (hasRole(target, discordConfig().roles.exile)) {
  //     clearExileTimer(target);
  //   }

  //   let nextLowest = getPreviousRole(target, target.guild);

  //   if (nextLowest == null) {
  //     if (channel) channel.watchSend(`${target} can't get any lower`);
  //     return;
  //   }

  //   setInfractions(target, null, 0, null);

  //   if (nextLowest.id == discordConfig().roles.exile) {
  //     exileMember(target, channel, dayjs().add(1, "day"));
  //     return;
  //   }

  //   // demote the target
  //   setHoistedRole(target, nextLowest);
  //   let roleName = nextLowest.name;
  //   if (roleName === "@everyone") {
  //     roleName = "commoner";
  //   }
  //   setHoistedRole(target, nextLowest).then(([roleChanged, memberLimit]) => {
  //     if (roleChanged) {
  //       channel.watchSend(`${target} has been demoted to ${roleName}!`);
  //     } else {
  //       channel.watchSend(
  //         `Cannot demote because ${roleName} already has ${nextLowest.members.size}/${memberLimit} members!`
  //       );
  //     }
  //   });
  // }
}

export default MemberController;
