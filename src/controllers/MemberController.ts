import dayjs from "dayjs";
import delay from "delay";
import { GuildMember, Role, RoleResolvable } from "discord.js";
import links from "../../resources/links";
import { Result } from "../enums/Result";
import RoleUtil from "../RoleUtil";
import MemberLimitError from "../structures/errors/MemberLimitError";
import RaphError from "../structures/errors/RaphError";
import GuildBasedController from "./Controller";

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
      const user = await this.ec.db.users.get(member.id, member.guild.id);
      count = user.infractions;
    }
    const response = `${member.toString()} has incurred ${count} infractions\n`;
    if (count >= this.infractionLimit) {
      return this.demoteMember(member, response);
    }
    return Promise.resolve(response);
  }

  public async softKick(member: GuildMember, reason?: string, kicker?: GuildMember) {
    const inviteChannel = member.guild.systemChannel;
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
        const randInt = Math.floor(Math.random() * links.gifs.kicks.length);
        const kickGif = links.gifs.kicks[randInt];

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

    const higherRoles = this.ec.guild.roles.cache
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

    const lowerRoles = this.ec.guild.roles.cache
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
    const currentRoles = clearAllRoles
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
    const discordRoles = RoleUtil.parseRoles(member.guild, roles);
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

    const nextRoleDb = await this.ec.db.roles.getSingle(nextRole.id);

    // Check promotion CD
    if (nextRoleDb.lastPromotionOn) {
      const rolesLowToHigh = this.ec.guild.roles.cache
        .filter((role) => role.hoist)
        .sort((a, b) => a.comparePositionTo(b))
        .array()
        .map((r) => r.id);
      const roleHeight = rolesLowToHigh.indexOf(nextRoleDb.id);

      if (roleHeight >= 0) {
        const promotionAvailableDate = nextRoleDb.lastPromotionOn.add(roleHeight, "days");
        if (promotionAvailableDate.isAfter(dayjs())) {
          throw new RaphError(Result.OnCooldown, promotionAvailableDate);
        }
      }
    }

    // If it's contested, no one can move into it
    if (nextRoleDb.contested) {
      throw new MemberLimitError(
        nextRoleDb.memberLimit,
        `Cannot promote ${member.toString()} to ${nextRole.name} ` +
          `since it is currently being contested. Try again after the contest is resolved\n`
      );
    }

    // If it's full, but not contested, start a new contest
    if (
      !nextRoleDb.unlimited &&
      nextRole.members.size >= nextRoleDb.memberLimit &&
      member.roles.hoist
    ) {
      return this.ec.roleContestController.startContest(nextRole, member.roles.hoist, member);
    }

    return this.promoteMember(member, nextRole).then((text) => {
      this.ec.channelHelper.watchSend(text);
    });
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

    return this.setHoistedRole(member, role).then(async (roleChanged) => {
      if (roleChanged) {
        role && (await this.ec.db.roles.updateRolePromotionDate(role.id));

        await this.setInfractions(member, 0);

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
}
