import Discord from "discord.js";

import SingletonMessageController from "./SingletonMessageController.js";

class RoleStatusController extends SingletonMessageController {
  /**
   * @param {Database} db
   * @param {Discord.Guild} guild
   */
  constructor(db, guild) {
    super(db, guild);
    this.guildProperty = "roleMessageId";
  }

  /**
   * @returns {Promise<Discord.RichEmbed>}
   */
  async generateEmbed() {
    const roleFields = await this.getFields();
    const statusEmbed = {
      color: 0x73f094,
      title: "Roles",
      timestamp: new Date(),
      fields: roleFields,
      thumbnail: { url: "https://i.imgur.com/Q8GEn6N.png" },
    };

    return statusEmbed;
  }

  /**
   * @returns {Promise<EmbedField[]>}
   */
  async getFields() {
    let fields = [];
    let discordRoles = this.guild.roles
      .filter((role) => role.hoist)
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .array();
    for (let i = 0; i < discordRoles.length; i++) {
      let dbRole = await this.db.roles.getSingle(discordRoles[i].id);
      let roleInfo = `Members: ${discordRoles[i].members.size}`;
      if (dbRole.memberLimit >= 0) {
        roleInfo += `/${dbRole.memberLimit}`;
      }
      fields.push({
        name: discordRoles[i].name,
        value: roleInfo,
        inline: true,
      });
    }

    return fields;
  }

  setMessage(messageId) {
    return this.db.guilds.setRoleMessage(this.guild.id, messageId);
  }
}

export default RoleStatusController;
