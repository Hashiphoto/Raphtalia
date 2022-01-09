import { EmbedFieldData, Guild as DsGuild, MessageEmbed } from "discord.js";
import { delay, inject, injectable } from "tsyringe";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";
import RoleService from "../Role.service";
import EmbedMessageManager from "./EmbedMessage.service";

@injectable()
export default class RoleListService extends EmbedMessageManager {
  public constructor(
    @inject(delay(() => GuildService)) protected guildService: GuildService,
    @inject(delay(() => ChannelService)) protected channelService: ChannelService,
    @inject(delay(() => CensorshipService)) protected censorshipService: CensorshipService,
    @inject(delay(() => RoleService)) private _roleService: RoleService
  ) {
    super(guildService, channelService, censorshipService);

    this.guildProperty = "roleMessageId";
  }

  protected async setMessage(guildId: string, messageId: string): Promise<void> {
    await this.guildService.setRoleMessage(guildId, messageId);
  }

  protected async generateEmbed(guild: DsGuild): Promise<MessageEmbed> {
    const roleFields = await this.getFields(guild);
    const statusEmbed = new MessageEmbed()
      .setColor(0x73f094)
      .setTitle("Roles")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/Q8GEn6N.png")
      .addFields(roleFields);

    return statusEmbed;
  }

  private async getFields(guild: DsGuild): Promise<EmbedFieldData[]> {
    const fields = [];

    const discordRoles = [
      ...guild.roles.cache
        .filter((role) => role.hoist)
        .sort((a, b) => b.comparePositionTo(a))
        .values(),
    ];

    for (let i = 0; i < discordRoles.length; i++) {
      const dbRole = await this._roleService.getRole(discordRoles[i].id);
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
