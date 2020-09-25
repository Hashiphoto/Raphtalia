import Discord from "discord.js";
import Item from "../structures/Item.js";

class UserInventory {
  /**
   * @param {Discord.GuildMember} member
   * @param {Item[]} items
   */
  constructor(member, items) {
    this.user = member;
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
      .setColor(this.user.displayColor)
      .setTitle(`${this.user.displayName}'s Inventory`)
      .setTimestamp(new Date());

    fields.forEach((field) => embed.addField(field.name, field.value, field.inline));

    return embed;
  }
}

export default UserInventory;
