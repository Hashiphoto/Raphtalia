import { EmbedFieldData, Guild as DsGuild, MessageEmbed } from "discord.js";
import { inject, injectable } from "tsyringe";
import CensorshipService from "../Censorship.service";
import ChannelService from "../Channel.service";
import GuildService from "../Guild.service";
import RoleService from "../Role.service";
import EmbedMessageService from "./EmbedMessage.service";

@injectable()
export default class RoleStatusController extends EmbedMessageService {
  public constructor(
    protected guild: DsGuild,
    @inject(GuildService) protected guildService: GuildService,
    @inject(ChannelService) protected channelService: ChannelService,
    @inject(CensorshipService) protected censorshipService: CensorshipService,
    @inject(RoleService) private _roleService: RoleService
  ) {
    super(guild, guildService, channelService, censorshipService);

    this.guildProperty = "roleMessageId";
  }

  protected async setMessage(messageId: string): Promise<void> {
    await this.guildService.setRoleMessage(this.guild.id, messageId);
  }

  protected async generateEmbed(): Promise<MessageEmbed> {
    const roleFields = await this.getFields();
    const statusEmbed = new MessageEmbed()
      .setColor(0x73f094)
      .setTitle("Roles")
      .setTimestamp(new Date())
      .setThumbnail("https://i.imgur.com/Q8GEn6N.png")
      .addFields(roleFields);

    return statusEmbed;
  }

  private async getFields(): Promise<EmbedFieldData[]> {
    const fields = [];

    const discordRoles = this.guild.roles.cache
      .filter((role) => role.hoist)
      .sort((a, b) => b.comparePositionTo(a))
      .array();

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
