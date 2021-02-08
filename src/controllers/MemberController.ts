import { GuildMember, MessageEmbed, Role, RoleResolvable } from "discord.js";

import GuildBasedController from "./Controller";
import MemberLimitError from "../structures/errors/MemberLimitError";
import RNumber from "../structures/RNumber";
import RoleContestBid from "../structures/RoleContestBid";
import RoleUtil from "../RoleUtil";
import dayjs from "dayjs";
import delay from "delay";
import links from "../../resources/links";

export default class MemberController extends GuildBasedController {
  private infractionLimit = 3;

  public hasAuthorityOver(sender: GuildMember, target: GuildMember | GuildMember[]) {
    const isHigher = (member: GuildMember, otherMember: GuildMember) => {
      return (
        member.id != otherMember.id &&
        member.roles.highest.comparePositionTo(otherMember.roles.highest) > 0
      );
    };
    if (Array.isArray(target)) {
      return target.every((target) => isHigher(sender, target));
    }
    return isHigher(sender, target);
  }

  /**
   * Increases the infraction count for a given member. If they exceed the this.infractionLimit, the member
   * is exiled
   */
  public addInfractions(member: GuildMember, amount = 1) {
    return this.ec.db.users
      .incrementInfractions(member.id, member.guild.id, amount)
      .then(() => this.getInfractions(member))
      .then((count) => {
        return this.checkInfractionCount(member, count);
      });
  }

  /**
   * Set the absolute infraction count for a given member
   */
  public setInfractions(member: GuildMember, amount: number) {
    return this.ec.db.users
      .setInfractions(member.id, member.guild.id, amount)
      .then(() => this.getInfractions(member))
      .then((count) => {
        return this.checkInfractionCount(member, count);
      });
  }

  /**
   * Print out the number of infractions a member has incurred in the given channel
   */
  public getInfractions(member: GuildMember) {
    return this.ec.db.users.get(member.id, this.ec.guild.id).then((user) => {
      return user.infractions;
    });
  }

  /**
   * Check if infractions is over the limit, then exile the member if so.
   * If they are already in exile, then softkick them.
   */
  public async checkInfractionCount(member: GuildMember, count?: number) {
    if (count === undefined) {
      let user = await this.ec.db.users.get(member.id, member.guild.id);
      count = user.infractions;
    }
    let response = `${member.toString()} has incurred ${count} infractions\n`;
    if (count >= this.infractionLimit) {
      return this.demoteMember(member, response);
    }
    return Promise.resolve(response);
  }

  public async softKick(member: GuildMember, reason?: string, kicker?: GuildMember) {
    let inviteChannel = member.guild.systemChannel;
    if (!inviteChannel) {
      return;
    }
    return inviteChannel
      .createInvite({ temporary: true, maxAge: 0, maxUses: 1, unique: true })
      .then((invite) =>
        member
          .send(
            `You were kicked from ${this.ec.guild.name} ${
              kicker ? `by ${kicker.displayName}` : ``
            } ${reason ?? ""}` +
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
   */
  public getNextRole(member: GuildMember) {
    const curRole =
      member.roles.hoist ?? this.ec.guild.roles.cache.find((r) => r.name === "@everyone");
    if (!curRole) {
      return;
    }

    var higherRoles = this.ec.guild.roles.cache
      .filter((role) => role.comparePositionTo(curRole) > 0 && role.hoist)
      .array()
      .sort((role1, role2) => {
        return role1.position - role2.position;
      });

    if (higherRoles.length === 0) {
      return;
    }

    return higherRoles[0];
  }

  /**
   * Get the next lowest hoisted role for a given member
   */
  getPreviousRole(member: GuildMember) {
    const curRole = member.roles.hoist;
    if (!curRole) {
      return;
    }

    var lowerRoles = this.ec.guild.roles.cache
      .filter((role) => role.comparePositionTo(curRole) < 0 && role.hoist)
      .array()
      .sort((role1, role2) => {
        return role1.comparePositionTo(role2);
      });

    if (lowerRoles.length === 0) {
      return;
    }

    return lowerRoles[lowerRoles.length - 1];
  }

  /**
   * If the member is an exile, remove all hoisted roles from them. If they are not an exile, nothing happens
   */
  public pardonMember(member: GuildMember) {
    return this.ec.db.users.setInfractions(member.id, member.guild.id, 0).then(() => {
      const response = `${member.toString()}'s infractions have been reset\n`;
      const exileRole = this.ec.guild.roles.cache.find((r) => r.name === "Exile");
      if (!exileRole) {
        return "";
      }
      const inExile = member.roles.cache.has(exileRole.id);
      if (inExile) {
        return member.roles
          .remove(exileRole)
          .then(() => response + `${member.toString()}'s exile has ended\n`);
      }

      return response;
    });
  }

  /**
   * Remove all hoisted roles and give the member the exile role
   */
  public async exileMember(member: GuildMember, duration: number) {
    const exileRole = this.ec.guild.roles.cache.find((r) => r.name === "Exile");
    if (!exileRole) {
      return;
    }
    return member.roles.add(exileRole).then(() => {
      return delay(duration).then(() => member.roles.remove(exileRole));
    });
  }

  /**
   * Check if a member has a given role specified by role id
   */
  public hasRole(member: GuildMember, role: RoleResolvable) {
    const solidRole = RoleUtil.convertToRole(member.guild, role);
    if (!solidRole) {
      return false;
    }
    return !!member.roles.cache.get(solidRole.id);
  }

  /**
   * Verify that a member has the given role or higher
   */
  public hasRoleOrHigher(member: GuildMember, role: RoleResolvable) {
    const solidRole = RoleUtil.convertToRole(member.guild, role);
    if (!solidRole) {
      return false;
    }
    return member.roles.highest.comparePositionTo(solidRole) >= 0;
  }

  /**
   * Set the roles of a guildMember. All hoisted roles are removed first
   *
   * @param {Discord.GuildMember} member - The member to set the roles for
   * @param {RoleResolvable[]} role - An array of roles representing the names of the roles to give the members
   * @param {Boolean} clearAllRoles - True to remove all hoisted and non-hoisted roles first
   */
  public async setHoistedRole(member: GuildMember, role: RoleResolvable, clearAllRoles = false) {
    const discordRole = RoleUtil.convertToRole(member.guild, role);
    if (!discordRole) {
      throw new Error(`Role does not exist: ${role}`);
    }

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

  public addRoles(member: GuildMember, roles: RoleResolvable[]) {
    var discordRoles = RoleUtil.parseRoles(member.guild, roles);
    return member.roles.add(discordRoles);
  }

  /**
   * Promote member, respecting role limits. Starts a contest if the role is full
   */
  public async protectedPromote(member: GuildMember) {
    const nextRole = this.getNextRole(member);
    if (!nextRole) {
      throw new RangeError(`${member.toString()} holds the highest office already\n`);
    }

    const dbRole = await this.ec.db.roles.getSingle(nextRole.id);

    // If it's contested, no one can move into it
    if (dbRole.contested) {
      throw new MemberLimitError(
        dbRole.memberLimit,
        `Cannot promote ${member.toString()} to ${nextRole.name} ` +
          `since it is currently being contested. Try again after the contest is resolved\n`
      );
    }

    // If it's full, but not contested, start a new contest
    if (!dbRole.unlimited && nextRole.members.size >= dbRole.memberLimit && member.roles.hoist) {
      await this.startContest(nextRole, member.roles.hoist, member);
      const contestMessage =
        // `**${this.ec.initiator.toString()} is contesting a promotion into the ${nextRole} role!**\n` +
        `🔸 ${this.ec.initiator.toString()} and everyone who currently holds the ${nextRole} role can give me money to keep the role. ` +
        `Whoever gives the least amount of money by the end of the contest period will be demoted.\n` +
        `🔸 Contests are resolved at 8PM every day, if at least 24 hours have passed since the start of the contest.\n` +
        `🔸 Use the command \`!Give @Raphtalia $1.00\` to pay me\n`;
      const statusEmbed = new MessageEmbed()
        .setColor(nextRole.color)
        .setTitle(`Role Contest | ${member.displayName} -> ${nextRole.name}`)
        .setTimestamp(new Date())
        .setThumbnail("https://i.imgur.com/W5yJcBQ.png")
        .addFields({ name: "Current Bids", value: "None" });

      return await this.ec.channel.send(contestMessage, statusEmbed);
    }

    return this.promoteMember(member, nextRole);
  }

  /**
   * Remove all hoisted roles from one target and increase their former highest role by one
   *
   * @param {Discord.GuildMember} member - The GuildMember being promoted
   * @param {Discord.Role} role - If left empty, the next highest role will be used
   * @throws {RangeError}
   */
  public async promoteMember(member: GuildMember, role?: Role) {
    if (!role) {
      role = this.getNextRole(member);
      if (!role) {
        throw new RangeError(`${member.toString()} holds the highest office already\n`);
      }
    }

    return this.setHoistedRole(member, role).then((roleChanged) => {
      if (roleChanged) {
        this.setInfractions(member, 0);
        return `${member.toString()} has been promoted to **${
          role?.name
        }**!\nInfractions have been reset\n`;
      } else {
        return `Could not promote ${member.toString()} to ${role?.name}\n`;
      }
    });
  }

  public async demoteMember(target: GuildMember, response = "") {
    let nextLowest = this.getPreviousRole(target);

    if (!nextLowest) {
      throw new RangeError(`${response}\n${target.toString()} can't get any lower\n`);
    }

    this.setInfractions(target, 0);

    let changed = false;
    while (!changed) {
      await this.setHoistedRole(target, nextLowest)
        .then(() => {
          changed = true;
          response += `${target.toString()} has been demoted to **${
            nextLowest?.name
          }**!\nInfractions have been reset\n`;
        })
        .catch((error) => {
          if (error instanceof MemberLimitError) {
            response += error.message;
            if (!nextLowest) {
              return response;
            }
            nextLowest = RoleUtil.getNextLower(nextLowest, this.ec.guild);
          }
        });
    }

    return response;
  }

  public startContest(contestedRole: Role, previousRole: Role, member: GuildMember) {
    return this.ec.db.roles.insertRoleContest(
      contestedRole.id,
      previousRole.id,
      member.id,
      new Date()
    );
  }

  public async resolveRoleContests(force = false) {
    const allContests = await this.ec.db.roles.getAllContests(this.ec.guild.id);

    // Get all contests over 24 hours old, or all of them when force
    const dueContests = allContests.filter((contest) => {
      return force ? true : dayjs(contest.startDate).add(24, "hour").isBefore(dayjs());
    });

    const promises = dueContests.map(async (contest) => {
      const role = RoleUtil.convertToRole(this.ec.guild, contest.roleId);
      const contestor = this.ec.guild.members.cache.get(contest.initiatorId);
      if (!role || !contestor) {
        return "";
      }
      const participants = role.members.array();
      participants.push(contestor);

      // If there are no bids, everyone loses
      const loserBid = contest.getLowestBid(participants);
      if (!loserBid) {
        return "There are no bids. Roles will remain the same";
      }

      await this.ec.db.roles.deleteContest(contest.id);
      const punishFeedback = await this.punishContestLoser(contestor, loserBid, role);

      return (
        `**The contest for the ${role} role is over!**\n` +
        `The loser is ${loserBid.member} with a measly bid of ` +
        `${RNumber.formatDollar(loserBid.amount)}!\n` +
        `${punishFeedback}\n\n`
      );
    });

    return Promise.all(promises);
  }

  public punishContestLoser(contestor: GuildMember, loserBid: RoleContestBid, role: Role) {
    // If the contestor loses, we can just demote him
    if (loserBid.userId === contestor.id) {
      return this.demoteMember(contestor);
    }
    // Initiator promoted to role. Loser demoted
    else {
      return this.promoteMember(contestor, role).then((feedback) =>
        this.demoteMember(loserBid.member, feedback)
      );
    }
  }
}
