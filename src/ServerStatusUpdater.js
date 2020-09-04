import GuildBasedController from "./controllers/GuildBasedController.js";

class ServerStatusUpdater extends GuildBasedController {
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
    let embedFields = [];
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
      embedFields.push({
        name: discordRoles[i].name,
        value: roleInfo,
        inline: true,
      });
    }
    const statusEmbed = {
      color: 0x73f094,
      title: `SERVER STATUS`,
      timestamp: new Date(),
      fields: embedFields,
    };

    return statusEmbed;
  }
}

export default ServerStatusUpdater;
