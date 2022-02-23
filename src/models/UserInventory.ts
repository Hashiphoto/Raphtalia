import { GuildMember, MessageEmbed } from "discord.js";
import { formatDate } from "../utilities/Util";
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
    const fields = this.groupItems().map((items) => {
      const expirations = items.reduce((sum, current) => {
        return current.expirationDate ? sum + `🕒 ${formatDate(current.expirationDate)}\n` : sum;
      }, "");
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
  private groupItems(): UserItem[][] {
    const itemMap = new Map<string, UserItem[]>();
    this.items.forEach((userItem) => {
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
