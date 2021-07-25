import GuildBasedController from "./Controller";
import GuildItem from "../structures/GuildItem";
import { GuildMember } from "discord.js";
import Item from "../structures/Item";
import RaphError from "../structures/errors/RaphError";
import { Result } from "../enums/Result";
import UserInventory from "../structures/UserInventory";
import UserItem from "../structures/UserItem";

const MIN_PRICE_HIKE = 0.25;

export default class InventoryController extends GuildBasedController {
  /** GUILD ITEMS **/
  public async findGuildItem(name: string) {
    return this.ec.db.inventory.findGuildItem(this.ec.guild.id, name);
  }

  public async updateGuildItem(item: GuildItem) {
    return this.ec.db.inventory.updateGuildItem(this.ec.guild.id, item);
  }

  public async subtractGuildStock(item: GuildItem, quantity: number) {
    if (item.unlimitedQuantity) {
      // Record how many are sold
      return this.ec.db.inventory.updateGuildItemSold(this.ec.guild.id, item, quantity, new Date());
    }

    // Update the quantity AND how many are sold
    return this.ec.db.inventory.updateGuildItemQuantity(
      this.ec.guild.id,
      item,
      -quantity,
      new Date()
    );
  }

  public async increaseGuildItemPrice(guildItem: GuildItem): Promise<void> {
    const dbGuild = await this.ec.db.guilds.get(this.ec.guild.id);

    if (!dbGuild) {
      return;
    }
    const priceMultiplier = Math.exp((guildItem.soldInCycle - 1) * dbGuild.priceHikeCoefficient);
    // No work
    if (priceMultiplier === 1) {
      return;
    }
    // Increase by a minimum of 1 dollar
    const newPrice = Math.max(priceMultiplier * guildItem.price, guildItem.price + MIN_PRICE_HIKE);

    await this.ec.db.inventory.updateGuildItemPrice(this.ec.guild.id, guildItem, newPrice);
  }

  public async getGuildItemByCommand(guildId: string, commandName: string) {
    return this.ec.db.inventory.getGuildItemByCommand(guildId, commandName);
  }

  /** USER ITEMS **/
  public async findUserItem(member: GuildMember, name: string): Promise<UserItem | undefined> {
    return this.ec.db.inventory.findUserItem(this.ec.guild.id, member.id, name);
  }

  /**
   * Purchase an item from the store, taking into account cost and available quantity
   */
  public async userPurchase(item: GuildItem, user: GuildMember, quantity = 1) {
    // Check available stock
    if (!item.inStock()) {
      throw new RaphError(Result.OutOfStock);
    }
    const userCurrency = await this.ec.currencyController.getCurrency(this.ec.initiator);
    if (userCurrency < item.price) {
      throw new RaphError(Result.TooPoor);
    }

    // Transfer money
    await this.ec.currencyController.transferCurrency(
      this.ec.initiator,
      this.ec.raphtalia,
      item.price
    );

    // Subtract from guild stock
    const updatedItem = await this.subtractGuildStock(item, quantity);
    if (!updatedItem) {
      return;
    }
    if (updatedItem.soldInCycle > 0) {
      await this.increaseGuildItemPrice(updatedItem);
    }

    // Add it to player stock
    item.quantity = quantity;
    await this.ec.db.inventory.insertUserItem(this.ec.guild.id, user.id, item);

    // Return the user's new item
    return this.ec.db.inventory.getUserItem(this.ec.guild.id, user.id, item.id);
  }

  public async getUserInventory(user: GuildMember) {
    return this.ec.db.inventory
      .getUserItems(user.guild.id, user.id)
      .then((items) => new UserInventory(user, items));
  }

  public async getUserItemByCommand(member: GuildMember, commandName: string) {
    return this.ec.db.inventory.getUserItemByCommand(this.ec.guild.id, member.id, commandName);
  }

  public async useItem(item: UserItem, member: GuildMember, uses: number) {
    if (item.unlimitedUses) {
      return Promise.resolve();
    }

    item.remainingUses -= uses;

    // Check if quantity needs to be reduced
    const newQuantity = Math.ceil(item.remainingUses / item.maxUses);
    if (item.quantity !== newQuantity) {
      item.quantity = newQuantity;
      this.ec.db.inventory.updateGuildItemQuantity(this.ec.guild.id, item, uses);
    }

    return this.updateUserItem(item, member).then(() => {
      return item;
    });
  }

  public async updateUserItem(item: UserItem, member: GuildMember) {
    if (item.quantity === 0) {
      return this.ec.db.inventory.deleteUserItem(this.ec.guild.id, member.id, item);
    }

    return this.ec.db.inventory.updateUserItem(this.ec.guild.id, member.id, item);
  }

  public async transferItem(item: UserItem, fromMember: GuildMember, toMember: GuildMember) {
    // Remove the item from the owner
    item.quantity -= 1;
    item.remainingUses -= item.maxUses;
    this.updateUserItem(item, fromMember);

    // Reset the item and give it to the receiver
    const givenItem = item.copy();
    givenItem.quantity = 1;
    givenItem.remainingUses = givenItem.maxUses;
    return this.ec.db.inventory.insertUserItem(this.ec.guild.id, toMember.id, givenItem);
  }

  public async findUsersWithItem(item: Item) {
    return this.ec.db.inventory.findUsersWithItem(this.ec.guild.id, item.id);
  }
}
