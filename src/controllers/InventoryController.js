import GuildBasedController from "./GuildBasedController.js";
import Discord from "discord.js";
import Item from "../structures/Item.js";

class InventoryController extends GuildBasedController {
  getItem(name) {
    return this.db.inventory.getItem(this.guild.id, name);
  }

  /**
   * @param {Item} item
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
}

export default InventoryController;
