import { Format, formatDate, print } from "../utilities/Util";
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
    // All the items are identical, so we aggregate them into a single field
    const fields = UserInventory.groupItems(this.items).map((items) => {
      const expirationMap = new Map<string, number>();
      items.forEach((item) => {
        if (!item.expirationDate) {
          return;
        }
        const dateString = formatDate(item.expirationDate);
        const entry = expirationMap.get(dateString);
        expirationMap.set(dateString, entry ? entry + 1 : 1);
      });

      let expirations = "";
      expirationMap.forEach((numEntries, dateString) => {
        expirations += `🕒 ${dateString}${
          numEntries > 1 ? `(x${print(numEntries, Format.Integer)})` : ""
        }\n`;
      });

      const aggregate = items[0].copy();
      aggregate.quantity = items.reduce((sum, current) => sum + current.quantity, 0);
      aggregate.remainingUses = items.reduce((sum, current) => sum + current.remainingUses, 0);
      return {
        name: aggregate.getFormattedName(),
        value: aggregate.getDetails(expirations),
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
  public static groupItems(items: UserItem[]): UserItem[][] {
    const itemMap = new Map<string, UserItem[]>();
    items.forEach((userItem) => {
      const itemArray = itemMap.get(userItem.itemId);
      if (itemArray) {
        itemArray.push(userItem);
      } else {
        itemMap.set(userItem.itemId, [userItem]);
      }
    });
    return Array.from(itemMap, ([, userItem]) => userItem);
  }
}
