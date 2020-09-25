import Discord from "discord.js";
import Item from "../structures/Item.js";

class UserInventory {
  /**
   *
   * @param {Discord.GuildMember} user
   * @param {Item[]} items
   */
  constructor(user, items) {
    this.user = user;
    this.items = items;
  }

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
