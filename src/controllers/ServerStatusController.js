import GuildBasedController from "./GuildBasedController.js";

class ServerStatusController extends GuildBasedController {
  async updateServerStatus() {
    const statusEmbed = await this.generateServerStatus(this.guild);

    return this.db.guilds.get(this.guild.id).then(async (dbGuild) => {
      // Exit if no message to update
      if (!dbGuild || !dbGuild.status_message_id) {
        return;
      }
      // Find the existing message and update it
      let textChannels = this.guild.channels
        .filter((channel) => channel.type === "text" && !channel.deleted)
        .array();
      for (let i = 0; i < textChannels.length; i++) {
        try {
          let message = await textChannels[i].fetchMessage(dbGuild.status_message_id);
          message.edit({ embed: statusEmbed });
          break;
        } catch (e) {}
      }
    });
  }

  async generateServerStatus() {
    const roleFields = await this.getRoleFields();
    const storeFields = await this.getStoreFields();
    const allFields = roleFields.concat(storeFields);
    const statusEmbed = {
      color: 0x73f094,
      title: this.guild.name.toUpperCase(),
      timestamp: new Date(),
      fields: allFields,
      thumbnail: { url: this.guild.iconURL },
    };

    return statusEmbed;
  }

  async getRoleFields() {
    let fields = [
      {
        name: "----------\nRoles",
        value: "----------",
      },
    ];
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

  async getStoreFields() {
    const fields = [
      {
        name: "----------\nStore",
        value: "----------",
      },
    ];

    const items = await this.db.guildInventory.get(this.guild.id);

    const itemFields = items.map((item) => {
      return {
        name: item.name,
        value: item.toString(),
        inline: true,
      };
    });

    return fields.concat(itemFields);
  }
}

export default ServerStatusController;
