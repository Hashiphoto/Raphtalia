import Discord from "discord.js";

import SingletonMessageController from "./SingletonMessageController.js";

class RoleStatusController extends SingletonMessageController {
  async update() {
    const statusEmbed = await this.generateEmbed(this.guild);

    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Exit if no message to update
      if (!dbGuild || !dbGuild.storeMessageId) {
        return;
      }
      // Find the existing message and update it
      let textChannels = this.guild.channels
        .filter((channel) => channel.type === "text" && !channel.deleted)
        .array();
      for (let i = 0; i < textChannels.length; i++) {
        try {
          let message = await textChannels[i].fetchMessage(dbGuild.storeMessageId);
          message.edit({ embed: statusEmbed });
          break;
        } catch (e) {}
      }
    });
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
      thumbnail: { url: this.guild.iconURL },
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
      let roleInfo = `Daily Income: $${dbRole.income.toFixed(
        2
      )}\nPurchase Price: $${dbRole.price.toFixed(2)}\nMembers: ${discordRoles[i].members.size}`;
      if (dbRole.member_limit >= 0) {
        roleInfo += `/${dbRole.member_limit}`;
      }
      fields.push({
        name: discordRoles[i].name,
        value: roleInfo,
        inline: true,
      });
    }

    return fields;
  }

  removeMessage() {
    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Delete the existing status message, if it exists
      if (!dbGuild || !dbGuild.storeMessageId) {
        return;
      }

      return this.fetchMessage(dbGuild.storeMessageId).then((message) => {
        if (message) {
          return message.delete();
        }
      });
    });
  }

  setMessage(messageId) {
    return this.db.guilds.setRoleMessage(this.guild.id, messageId);
  }
}

export default RoleStatusController;
