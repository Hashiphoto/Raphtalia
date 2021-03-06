import Discord, { Guild, Role, RoleResolvable } from "discord.js";

export default class RoleUtil {
  public static parseRoles(guild: Guild, roles: RoleResolvable[]) {
    var discordRoles = [];
    for (var i = 0; i < roles.length; i++) {
      var roleObject = RoleUtil.convertToRole(guild, roles[i]);
      if (!roleObject) {
        console.error("Could not find role: " + roles[i]);
        continue;
      }
      discordRoles.push(roleObject);
    }
    return discordRoles;
  }

  public static convertToRole(guild: Guild, roleResolvable: RoleResolvable) {
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
    let matches = roleResolvable.match(/\d+/);
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

  public static getHoistedRoles(guild: Guild) {
    return guild.roles.cache.filter((role) => role.hoist).sort((a, b) => a.comparePositionTo(b));
  }

  /**
   * Returns the hoisted role one lower than the given role
   */
  public static getNextLower(role: Role, guild: Guild) {
    return guild.roles.cache
      .filter((r) => r.comparePositionTo(role) < 0 && r.hoist)
      .array()
      .sort((role1, role2) => {
        return role1.comparePositionTo(role2);
      })[0];
  }

  public static async ensureExileRole(guild: Guild) {
    let exileRole = guild.roles.cache.find((r) => r.name === "Exile");
    if (!exileRole) {
      exileRole = await guild.roles.create({
        data: { name: "Exile", hoist: false, color: "#010000" },
      });
      exileRole.setPosition(guild.roles.cache.size - 2);
    }
    return exileRole;
  }

  public static async ensureVoterRole(guild: Guild) {
    let voterRole = guild.roles.cache.find((r) => r.name === "Voter");
    if (!voterRole) {
      voterRole = await guild.roles.create({
        data: { name: "Voter", hoist: false, color: "#4cd692" },
      });
    }
    return voterRole;
  }
}
