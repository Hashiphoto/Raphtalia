import Discord, { GuildMember } from "discord.js";

import GuildBasedController from "./GuildBasedController.js";
import GuildItem from "../structures/GuildItem.js";
import UserInventory from "../structures/UserInventory.js";
import UserItem from "../structures/UserItem.js";

class InventoryController extends GuildBasedController {
  getGuildItem(name: String) {
    return this.db.inventory.findGuildItem(this.guild.id, name);
  }

  updateGuildItem(item: GuildItem) {
    return this.db.inventory.updateGuildItem(this.guild.id, item);
  }

  findUserItem(member: GuildMember, name: String) {
    return this.db.inventory.findUserItem(this.guild.id, member.id, name);
  }

  /**
   * @param {GuildItem} item
   * @param {Discord.GuildMember} user
   * @param {Number} quantity How many of the item is being purchased
   */
  async userPurchase(item: GuildItem, user: GuildMember, quantity = 1) {
    // Subtract from guild stock
    const updatedItem = await this.subtractGuildStock(item, quantity);
    if (updatedItem.soldInCycle > 1) {
      await this.increaseGuildItemPrice(updatedItem);
    }

    // Add it to player stock
    item.quantity = quantity;
    return this.db.inventory.insertUserItem(this.guild.id, user.id, item);
  }

  /**
   * @param {GuildItem} item
   * @returns {GuildItem} The guild item after updating
   */
  subtractGuildStock(item, quantity) {
    if (item.unlimitedQuantity) {
      // Record how many are sold
      return this.db.inventory.updateGuildItemSold(this.guild.id, item, quantity, new Date());
    }

    // Update the quantity AND how many are sold
    return this.db.inventory.updateGuildItemQuantity(this.guild.id, item, -quantity, new Date());
  }

  /**
   * @param {GuildItem} guildItem
   */
  increaseGuildItemPrice(guildItem) {
    return this.db.guilds.get(this.guild.id).then((dbGuild) => {
      const priceMultiplier = Math.exp((guildItem.soldInCycle - 1) * dbGuild.priceHikeCoefficient);
      if (priceMultiplier === 1) {
        return;
      }

      return this.db.inventory.updateGuildItemPrice(this.guild.id, guildItem, priceMultiplier);
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

  /**
   * @param {Discord.GuildMember} member
   * @param {String} commandName
   */
  getItemForCommand(member: GuildMember, commandName: String) {
    return this.db.inventory.getUserItemByCommand(this.guild.id, member.id, commandName);
  }

  /**
   * @param {UserItem} item
   * @param {Discord.GuildMember} member
   * @returns {Promise<UserItem|null>}
   */
  useItem(item, member, uses) {
    if (item.unlimitedUses) {
      return Promise.resolve();
    }

    item.remainingUses -= uses;

    // Check if quantity needs to be reduced
    const newQuantity = Math.ceil(item.remainingUses / item.maxUses);
    if (item.quantity !== newQuantity) {
      item.quantity = newQuantity;
      this.db.inventory.updateGuildItemQuantity(this.guild.id, item, uses);
    }

    return this.updateUserItem(item, member).then(() => {
      return item;
    });
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
