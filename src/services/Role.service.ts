import Discord, { Collection, Guild as DsGuild, Role as DsRole, RoleResolvable } from "discord.js";
import { inject, injectable } from "tsyringe";
import Role from "../models/Role";
import RoleRepository from "../repositories/Role.repository";

@injectable()
export default class RoleService {
  public constructor(@inject(RoleRepository) private _roleRepository: RoleRepository) {}

  public async getRole(roleId: string): Promise<Role> {
    return this._roleRepository.getSingle(roleId);
  }

  public parseRoles(guild: DsGuild, roles: RoleResolvable[]): DsRole[] {
    const discordRoles = [];
    for (let i = 0; i < roles.length; i++) {
      const roleObject = this.convertToRole(guild, roles[i]);
      if (!roleObject) {
        console.error("Could not find role: " + roles[i]);
        continue;
      }
      discordRoles.push(roleObject);
    }
    return discordRoles;
  }

  public convertToRole(guild: DsGuild, roleResolvable: RoleResolvable): DsRole | undefined {
    // Test if it's already a role
    if (roleResolvable instanceof Discord.Role) {
      return roleResolvable;
    }

    // Test if it's an ID
    let role = guild.roles.cache.get(roleResolvable);
    if (role != null) {
      return role;
    }

    // Test if it's a mention
    const matches = roleResolvable.match(/\d+/);
    if (matches) {
      role = guild.roles.cache.get(matches[0]);
      if (role != null) {
        return role;
      }
    }

    // Test if it's a name
    role = guild.roles.cache.find((r) => r.name.toLowerCase() === roleResolvable.toLowerCase());

    return role;
  }

  /**
   * Returns all the hoisted roles in the guild, sorted highest to lowest
   */
  public getHoistedRoles(guild: DsGuild): Collection<string, DsRole> {
    return guild.roles.cache.filter((role) => role.hoist).sort((a, b) => b.comparePositionTo(a));
  }

  /**
   * Get the highest hoisted role in the guild
   */
  public getLeaderRole(guild: DsGuild): DsRole | undefined {
    return this.getHoistedRoles(guild).first();
  }

  /**
   * Returns the hoisted role one lower than the given role
   */
  public getNextLower(role: DsRole, guild: DsGuild): DsRole | undefined {
    return guild.roles.cache
      .filter((r) => r.comparePositionTo(role) < 0 && r.hoist)
      .sort((role1, role2) => {
        return role1.comparePositionTo(role2);
      })
      .first();
  }

  public async getCreateExileRole(guild: DsGuild): Promise<DsRole> {
    let exileRole = guild.roles.cache.find((r) => r.name === "Exile");
    if (!exileRole) {
      exileRole = await guild.roles.create({ name: "Exile", hoist: false, color: "#010000" });
      exileRole.setPosition(guild.roles.cache.size - 2);
    }
    return exileRole;
  }

  public async getCreateVoterRole(guild: DsGuild): Promise<DsRole> {
    let voterRole = guild.roles.cache.find((r) => r.name === "Voter");
    if (!voterRole) {
      voterRole = await guild.roles.create({ name: "Voter", hoist: false, color: "#4cd692" });
    }
    return voterRole;
  }

  public async resetRoleDates(role: DsRole): Promise<void> {
    return this._roleRepository.resetRoleDates(role.id);
  }
}
