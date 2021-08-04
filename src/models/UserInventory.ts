import { GuildMember, MessageEmbed } from "discord.js";

import UserItem from "./UserItem";

export default class UserInventory {
  public member: GuildMember;
  public items: UserItem[];

  public constructor(member: GuildMember, items: UserItem[]) {
    this.member = member;
    this.items = items;
  }

  public toEmbed() {
    const fields = this.items.map((item) => {
      return {
        name: item.getFormattedName(),
        value: item.getDetails(),
        inline: true,
      };
    });

    const embed = new MessageEmbed()
      .setColor(this.member.displayColor)
      .setTitle(`${this.member.displayName}'s Inventory`)
      .setTimestamp(new Date())
      .setThumbnail(this.member.user.avatarURL() ?? "");

    fields.forEach((field) => embed.addField(field.name, field.value, field.inline));

    return embed;
  }
}
