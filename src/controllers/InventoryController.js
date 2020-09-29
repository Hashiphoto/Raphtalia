import GuildBasedController from "./GuildBasedController.js";
import Discord from "discord.js";
import UserInventory from "../structures/UserInventory.js";
import GuildItem from "../structures/GuildItem.js";
import UserItem from "../structures/UserItem.js";

class InventoryController extends GuildBasedController {
  /**
   * @param {String} name
   * @returns {Promise<GuildItem>}
   */
  getGuildItem(name) {
    return this.db.inventory.findGuildItem(this.guild.id, name);
  }

  /**
   * @param {String} name
   * @param {Discord.GuildMember} member
   * @returns {Promise<UserItem>}
   */
  getUserItem(member, name) {
    return this.db.inventory.findUserItem(this.guild.id, member.id, name);
  }

  /**
   * @param {GuildItem} item
   * @param {Discord.GuildMember} user
   * @param {Number} quantity How many of the item is being purchased
   */
  async userPurchase(item, user, quantity = 1) {
    // Subtract from guild stock
    if (!item.unlimitedQuantity) {
      await this.db.inventory.updateGuildItemQuantity(this.guild.id, item, -1);
    }

    // Add it to player stock
    item.quantity = quantity;
    return this.db.inventory.insertUserItem(this.guild.id, user.id, item);
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

  /**
   * @param {Discord.GuildMember} member
   * @param {String} commandName
   */
  getItemForCommand(member, commandName) {
    return this.db.inventory.getUserItemByCommand(this.guild.id, member.id, commandName);
  }

  /**
   * @param {UserItem} item
   * @param {Discord.GuildMember} member
   */
  useItem(item, member, uses) {
    if (item.unlimitedUses) {
      return;
    }

    item.remainingUses -= uses;

    // Check if quantity needs to be reduced
    const newQuantity = Math.ceil(item.remainingUses / item.maxUses);
    if (item.quantity !== newQuantity) {
      item.quantity = newQuantity;
      this.db.inventory.updateGuildItemQuantity(this.guild.id, item, uses);
    }

    return this.updateUserItem(item, member);
  }

  updateUserItem(item, member) {
    if (item.quantity === 0) {
      return this.db.inventory.deleteUserItem(this.guild.id, member.id, item);
    }

    return this.db.inventory.updateUserItem(this.guild.id, member.id, item);
  }

  /**
   * @param {UserItem} item
   * @param {Discord.GuildMember} fromMember
   * @param {Discord.GuildMember} toMember
   */
  transferItem(item, fromMember, toMember) {
    // Remove the item from the owner
    item.quantity -= 1;
    item.remainingUses -= item.maxUses;
    this.updateUserItem(item, fromMember);

    // Reset the item and give it to the receiver
    const givenItem = item.copy();
    givenItem.quantity = 1;
    givenItem.remainingUses = givenItem.maxUses;
    return this.db.inventory.insertUserItem(this.guild.id, toMember.id, givenItem);
  }
}

export default InventoryController;
