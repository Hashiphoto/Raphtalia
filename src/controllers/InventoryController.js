import GuildBasedController from "./GuildBasedController.js";
import Discord from "discord.js";
import UserInventory from "../structures/UserInventory.js";
import GuildItem from "../structures/GuildItem.js";

class InventoryController extends GuildBasedController {
  getGuildItem(name) {
    return this.db.inventory.getGuildItem(this.guild.id, name);
  }

  /**
   * @param {GuildItem} item
   * @param {Discord.GuildMember} user
   * @param {Number} quantity How many of the item is being purchased
   */
  userPurchase(item, user, quantity = 1) {
    // Subtract from guild stock
    if (!item.unlimitedQuantity) {
      item.quantity -= quantity;
    }
    return this.db.inventory.updateGuildItem(this.guild.id, item).then(() => {
      // Add it to player stock
      item.quantity = quantity;
      return this.db.inventory.insertUserItem(this.guild.id, user.id, item);
    });
  }

  /**
   * @param {Discord.GuildMember} user
   * @returns {Promise<UserInventory>}
   */
  getUserInventory(user) {
    return this.db.inventory
      .getUserInventory(user.guild.id, user.id)
      .then((items) => new UserInventory(user, items));
  }
}

export default InventoryController;
