import Discord from "discord.js";
import Item from "../structures/Item.js";

class UserInventory {
  /**
   * @param {Discord.GuildMember} member
   * @param {Item[]} items
   */
  constructor(member, items) {
    this.member = member;
    this.items = items;
  }

  /**
   * @returns {Discord.RichEmbed}
   */
  toEmbed() {
    const fields = this.items.map((item) => {
      return {
        name: item.name,
        value: item.getDetails(),
        inline: true,
      };
    });

    const embed = new Discord.RichEmbed()
      .setColor(this.member.displayColor)
      .setTitle(`${this.member.displayName}'s Inventory`)
      .setTimestamp(new Date())
      .setThumbnail(this.member.user.avatarURL);

    fields.forEach((field) => embed.addField(field.name, field.value, field.inline));

    return embed;
  }
}

export default UserInventory;
