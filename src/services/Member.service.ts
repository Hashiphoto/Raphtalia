import dayjs from "dayjs";
import { Duration } from "dayjs/plugin/duration";
import delay from "delay";
import {
  GuildMember,
  PartialGuildMember,
  Role as DsRole,
  RoleResolvable,
  TextChannel,
} from "discord.js";
import { delay as tsDelay, inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import RaphError from "../models/RaphError";
import RoleRepository from "../repositories/Role.repository";
import UserRepository from "../repositories/User.repository";
import links from "../resources/links";
import { formatDate } from "../utilities/Util";
import RoleListService from "./message/RoleList.service";
import RoleService from "./Role.service";
import RoleContestService from "./RoleContest.service";

const INFRACTION_LIMIT = 3;

@injectable()
export default class MemberService {
  public constructor(
    @inject(UserRepository) private _usersRepository: UserRepository,
    @inject(RoleService) private _roleService: RoleService,
    @inject(tsDelay(() => RoleContestService)) private _roleContestService: RoleContestService,
    @inject(RoleRepository) private _roleRepository: RoleRepository,
    @inject(tsDelay(() => RoleListService)) private _roleListService: RoleListService
  ) {}

  public hasAuthorityOver(sender: GuildMember, target: GuildMember | GuildMember[]): boolean {
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

  public async handleMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
  ): Promise<void> {
    // Check if roles changed
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
      await this._roleListService.update(newMember.guild);
      return;
    }

    for (const [id] of oldMember.roles.cache) {
      if (!newMember.roles.cache.has(id)) {
        await this._roleListService.update(newMember.guild);
        return;
      }
    }
  }

  /**
   * Increases the infraction count for a given member
   * @returns the member's current infraction count
   */
  public async addInfractions(member: GuildMember, amount = 1): Promise<string> {
    await this._usersRepository.incrementInfractions(member.id, member.guild.id, amount);
    const count = await this.getInfractions(member);

    let response = `${member.toString()} has incurred ${count} infractions\n`;
    if (count >= INFRACTION_LIMIT) {
      response += await this.demoteMember(member);
    }
    return response;
  }

  /**
   * Set the absolute infraction count for a given member
   */
  public async resetInfractions(member: GuildMember): Promise<void> {
    await this._usersRepository.setInfractions(member.id, member.guild.id, 0);
  }

  /**
   * Print out the number of infractions a member has incurred in the given channel
   */
  public async getInfractions(member: GuildMember): Promise<number> {
    return this._usersRepository.get(member.id, member.guild.id).then((user) => {
      return user.infractions;
    });
  }

  public async softKick(
    member: GuildMember,
    reason?: string,
    kicker?: GuildMember
  ): Promise<string> {
    const inviteChannel = member.guild.systemChannel;
    if (!inviteChannel) {
      throw new RaphError(Result.NotFound, "There is no system channel in the server");
    }
    const invite = await inviteChannel.createInvite({
      temporary: true,
      maxAge: 0,
      maxUses: 1,
      unique: true,
    });

    await member
      .send(
        `You were kicked from ${member.guild.name} ` +
          `${kicker ? `by ${kicker.displayName}` : ``} ${reason ?? ""}\n` +
          invite.toString()
      )
      .then(() => member.kick())
      .catch((error) => {
        if (error.name === "DiscordAPIError" && error.message === "Missing Permissions") {
          return `I don't have high enough permissions to kick ${member.displayName}`;
        }
        throw error;
      });

    const randInt = Math.floor(Math.random() * links.gifs.kicks.length);
    const kickGif = links.gifs.kicks[randInt];

    return `:wave: ${member.displayName} has been kicked and invited back\n${kickGif}`;
  }

  /**
   * Get the next highest hoisted role for a given member
   */
  public getNextHighestRole(member: GuildMember): DsRole | undefined {
    const currentRole = member.roles.hoist;
    const hoistRoles = [...this._roleService.getHoistedRoles(member.guild).values()];

    if (!currentRole) {
      // Return the lowest role
      return hoistRoles[hoistRoles.length - 1];
    }

    const higherRoles = hoistRoles.slice(
      0,
      hoistRoles.findIndex((r) => r.id === currentRole.id)
    );
    // Already has the highest role
    if (!higherRoles.length) {
      return;
    }
    return higherRoles[higherRoles.length - 1];
  }

  /**
   * Get the next lowest hoisted role for a given member
   */
  public getNextLowerRole(member: GuildMember): DsRole | undefined {
    const currentRole = member.roles.hoist;
    const hoistRoles = [...this._roleService.getHoistedRoles(member.guild).values()];

    if (!currentRole) {
      // Return the lowest role
      return hoistRoles[hoistRoles.length - 1];
    }

    const lowerRoles = hoistRoles.slice(hoistRoles.findIndex((r) => r.id === currentRole.id));
    // Already has the lowest role
    if (!lowerRoles.length) {
      return;
    }
    return lowerRoles[0];
  }

  /**
   * If the member is an exile, remove all hoisted roles from them. If they are not an exile, nothing happens
   */
  public async pardonMember(member: GuildMember): Promise<string> {
    await this.resetInfractions(member);
    let response = `${member.toString()}'s infractions have been reset\n`;

    const exileRole = await this._roleService.getCreateExileRole(member.guild);
    const inExile = member.roles.cache.has(exileRole.id);
    if (inExile) {
      await member.roles.remove(exileRole);
      response += `${member.toString()}'s exile has ended\n`;
    }

    return response;
  }

  /**
   * Add the exile role to the target member for a given duration
   */
  public async exileMember(member: GuildMember, duration: Duration): Promise<void> {
    const exileRole = await this._roleService.getCreateExileRole(member.guild);
    await member.roles.add(exileRole);
    await delay(duration.asMilliseconds());
    await member.roles.remove(exileRole);
  }

  /**
   * Set the roles of a guildMember. All hoisted roles are removed first
   *
   * @param {Discord.GuildMember} member - The member to set the roles for
   * @param {RoleResolvable[]} roleResolvable - An array of roles representing the names of the roles to give the members
   * @param {Boolean} clearAllRoles - True to remove all hoisted and non-hoisted roles first
   */
  public async setHoistedRole(
    member: GuildMember,
    roleResolvable: RoleResolvable,
    force = false
  ): Promise<void> {
    const discordRole = this._roleService.convertToRole(member.guild, roleResolvable);
    if (!discordRole) {
      console.error(`Role ${roleResolvable} does not exist`);
      throw new RaphError(Result.NotFound);
    }

    const role = await this._roleService.getRole(discordRole.id);

    if (!force && !role.unlimited && discordRole.members.size >= role.memberLimit) {
      console.error(`Role ${role.id} is full`);
      throw new RaphError(Result.Full);
    }

    // Remove all hoisted roles and add the ones specified
    const hoistRoles = member.roles.cache.filter((r) => r.hoist);
    await member.roles.remove(hoistRoles);
    await member.roles.add(discordRole);
  }

  /**
   * Promote member, respecting role limits. Starts a contest if the role is full
   */
  public async promoteMember(member: GuildMember, channel: TextChannel): Promise<string> {
    const dsRole = this.getNextHighestRole(member);
    if (!dsRole) {
      throw new RaphError(
        Result.OutOfBounds,
        `${member.toString()} holds the highest office already\n`
      );
    }

    const role = await this._roleService.getRole(dsRole.id);

    // Check promotion CD
    if (role.lastPromotionOn) {
      const rolesLowToHigh = [...this._roleService.getHoistedRoles(member.guild).values()]
        .reverse()
        .map((r) => r.id);

      const roleHeight = rolesLowToHigh.indexOf(role.id);

      if (roleHeight >= 0) {
        const promotionAvailableDate = role.lastPromotionOn.add(roleHeight * 1.5, "days");
        if (promotionAvailableDate.isAfter(dayjs())) {
          throw new RaphError(
            Result.OnCooldown,
            `${dsRole.name} will be open for contests at ${formatDate(promotionAvailableDate)}`
          );
        }
      }
    }

    // If it's contested, no one can move into it
    if (role.contested) {
      throw new RaphError(
        Result.Full,
        `Cannot promote ${member.toString()} to ${dsRole.name} ` +
          `since it is currently being contested. Try again after the contest is resolved\n`
      );
    }

    // If it's full, but not contested, start a new contest
    if (!role.unlimited && dsRole.members.size >= role.memberLimit && member.roles.hoist) {
      await this._roleContestService.startContest(dsRole, member.roles.hoist, member, channel);
      return "";
    }

    return this.increaseMemberRank(member, dsRole);
  }

  /**
   * Remove all hoisted roles from one target and increase their former highest role by one
   *
   * @param {Discord.GuildMember} member - The GuildMember being promoted
   * @param {Discord.Role} role - If left empty, the next highest role will be used
   * @throws {RangeError}
   */
  public async increaseMemberRank(
    member: GuildMember,
    role?: DsRole,
    force = false
  ): Promise<string> {
    if (!role) {
      role = this.getNextHighestRole(member);
      if (!role) {
        throw new RangeError(`${member.toString()} holds the highest office already\n`);
      }
    }

    await this.setHoistedRole(member, role, force);
    await this._roleRepository.updateRolePromotionDate(role.id);
    await this.resetInfractions(member);

    return (
      `${member.toString()} has been promoted to ` +
      `**${role.name}**!\nInfractions have been reset\n`
    );
  }

  /**
   * Decrease the member's hoisted role to the next one with room
   */
  public async demoteMember(target: GuildMember): Promise<string> {
    const allHoistRoles = [...this._roleService.getHoistedRoles(target.guild).values()];
    const currentRole = target.roles.hoist;

    if (!allHoistRoles.length) {
      throw new RaphError(Result.Empty, "There are no hoisted roles in the guild");
    }

    if (!currentRole) {
      const lowestRole = allHoistRoles[allHoistRoles.length - 1];
      await this.setHoistedRole(target, lowestRole);
      return `${target.displayName} has been demoted to ${lowestRole.name}!\n`;
    }

    const lowerRoles = allHoistRoles.slice(
      allHoistRoles.findIndex((r) => r.id === currentRole.id) + 1
    );
    if (lowerRoles.length === 0) {
      throw new RaphError(Result.OutOfBounds, `${target.displayName} can't get any lower`);
    }

    let response = "";

    for (const role of lowerRoles) {
      try {
        await this.setHoistedRole(target, role);
        response +=
          `${target.displayName} has been demoted to ${role.name}!\n` +
          "Infractions have been reset\n";
        await this.resetInfractions(target);

        return response;
      } catch (error) {
        if (error.result === Result.Full) {
          response += `Cannot demote ${target.displayName} to ${role.name} because it is full\n`;
        }
      }
    }

    response += `There are no available lower roles to demote ${target.displayName}\n`;

    return response;
  }
}
