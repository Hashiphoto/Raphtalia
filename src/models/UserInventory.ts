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
    const fields = this.getAggregatedItems().map((item) => {
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

  /**
   * Combine items sharing the same item id
   */
  private getAggregatedItems(): UserItem[] {
    const itemMap = new Map<string, UserItem>();
    this.items.forEach((userItem) => {
      const item = itemMap.get(userItem.itemId);
      if (item) {
        item.quantity += userItem.quantity;
        item.remainingUses += userItem.remainingUses;
      } else {
        itemMap.set(userItem.itemId, userItem);
      }
    });
    return Array.from(itemMap, ([, userItem]) => userItem);
  }
}
