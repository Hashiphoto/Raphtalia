import Discord, { EmbedFieldData, MessageEmbed } from "discord.js";

import ExecutionContext from "../../models/ExecutionContext";
import SingletonMessageController from "./SingletonMessageController";

export default class RoleStatusController extends SingletonMessageController {
  public constructor(context: ExecutionContext) {
    super(context);
    this.guildProperty = "roleMessageId";
  }

  public async generateEmbed(): Promise<MessageEmbed> {
    const roleFields = await this.getFields();
    const statusEmbed = new Discord.MessageEmbed()
      .setColor(0x73f094)
      .setTitle("Roles")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/Q8GEn6N.png")
      .addFields(roleFields);

    return statusEmbed;
  }

  public setMessage(messageId: string) {
    return this.ec.db.guilds.setRoleMessage(this.ec.guild.id, messageId);
  }

  private async getFields(): Promise<EmbedFieldData[]> {
    const fields = [];

    const discordRoles = this.ec.guild.roles.cache
      .filter((role) => role.hoist)
      .sort((a, b) => b.comparePositionTo(a))
      .array();

    for (let i = 0; i < discordRoles.length; i++) {
      const dbRole = await this.ec.db.roles.getSingle(discordRoles[i].id);
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
}
