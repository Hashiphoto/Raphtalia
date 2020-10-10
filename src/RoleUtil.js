import Discord from "discord.js";

class RoleUtil {
  static parseRoles(guild, roles) {
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

  /**
   * Transforms a role name or role ID into a role. Objects that are already a role are ignored
   * @param {Discord.Guild} guild
   * @param {Discord.Role|String} roleResolvable
   */
  static convertToRole(guild, roleResolvable) {
    // Test if it's already a role
    if (roleResolvable instanceof Discord.Role) {
      return roleResolvable;
    }

    // Test if it's an ID
    let role = guild.roles.get(roleResolvable);
    if (role != null) {
      return role;
    }

    // Test if it's a mention
    let matches = roleResolvable.match(/\d+/);
    if (matches) {
      role = guild.roles.get(matches[0]);
      if (role != null) {
        return role;
      }
    }

    // Test if it's a name
    role = guild.roles.find((r) => r.name.toLowerCase() === roleResolvable.toLowerCase());

    return role;
  }

  /**
   * @param {Discord.Guild} guild
   * @returns {Discord.Collection<Discord.Role>} The hoisted roles, sorted lowest to highest
   */
  static getHoistedRoles(guild) {
    return guild.roles
      .filter((role) => role.hoist)
      .sort((a, b) => a.calculatedPosition - b.calculatedPosition);
  }
}

export default RoleUtil;

// Will become obsolete once item-based rule permissioning is implemented
// /**
//  * Like hasRoleOrHigher, but infracts the member if they don't have permission
//  *
//  * @param {Discord.GuildMember} member - The member to check permissions for
//  * @param {Discord.TextChannel} channel - The channel to send messages in
//  * @param {RoleResolvable} allowedRole - The hoisted role that the member must have (or higher)
//  * @returns {Boolean} True if the member has high enough permission
//  */
// export function verifyPermission(member, channel, allowedRole) {
//   if (!hasRoleOrHigher(member, allowedRole)) {
//     addInfractions(
//       member,
//       channel,
//       1,
//       "I don't have to listen to a peasant like you. This infraction has been recorded"
//     );
//     return false;
//   }

//   return true;
// }
