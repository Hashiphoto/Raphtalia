import { Guild as DsGuild, GuildMember } from "discord.js";
import { delay, inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import GuildItem from "../models/GuildItem";
import Item from "../models/Item";
import RaphError from "../models/RaphError";
import UserInventory from "../models/UserInventory";
import UserItem from "../models/UserItem";
import GuildInventoryRepository from "../repositories/GuildInventory.repository";
import UserInventoryRepository from "../repositories/UserInventory.repository";
import ClientService from "./Client.service";
import CurrencyService from "./Currency.service";
import GuildService from "./Guild.service";
import GuildStoreService from "./message/GuildStore.service";

const MIN_PRICE_HIKE = 0.25;

@injectable()
export default class InventoryService {
  public constructor(
    @inject(GuildInventoryRepository) private _guildInventoryRepo: GuildInventoryRepository,
    @inject(UserInventoryRepository) private _userInventoryRepo: UserInventoryRepository,
    @inject(GuildService) private _guildService: GuildService,
    @inject(CurrencyService) private _currencyService: CurrencyService,
    @inject(delay(() => ClientService)) private _clientService: ClientService,
    @inject(GuildStoreService) private _guildStoreService: GuildStoreService
  ) {}

  /** GUILD ITEMS **/
  public async findGuildItem(guildId: string, name: string): Promise<GuildItem | undefined> {
    return this._guildInventoryRepo.findGuildItem(guildId, name);
  }

  public async updateGuildItem(guild: DsGuild, item: GuildItem): Promise<void> {
    await this._guildInventoryRepo.updateGuildItem(item);
    this._guildStoreService.update(guild);
  }

  public async subtractGuildStock(
    guild: DsGuild,
    item: GuildItem,
    quantity: number
  ): Promise<GuildItem> {
    if (item.unlimitedQuantity) {
      // Record how many are sold
      await this._guildInventoryRepo.updateGuildItemSold(item.guildId, item, quantity, new Date());
    } else {
      // Update the quantity AND how many are sold
      await this._guildInventoryRepo.updateGuildItemQuantity(
        item.guildId,
        item,
        -quantity,
        new Date()
      );
    }

    this._guildStoreService.update(guild);
    return this._guildInventoryRepo.getGuildItem(item.guildId, item.id);
  }

  public async increaseGuildItemPrice(guild: DsGuild, guildItem: GuildItem): Promise<void> {
    const dbGuild = await this._guildService.getGuild(guildItem.guildId);
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

    await this._guildInventoryRepo.updateGuildItemPrice(guildItem.guildId, guildItem, newPrice);
    this._guildStoreService.update(guild);
  }

  public async getGuildItemByCommand(
    guildId: string,
    commandName: string
  ): Promise<GuildItem | undefined> {
    return this._guildInventoryRepo.getGuildItemByCommand(guildId, commandName);
  }

  /** USER ITEMS **/
  public async findUserItem(member: GuildMember, name: string): Promise<UserItem | undefined> {
    return this._userInventoryRepo.findUserItemByName(member.guild.id, member.id, name);
  }

  /**
   * Purchase an item from the store, taking into account cost and available quantity
   */
  public async userPurchase(member: GuildMember, item: GuildItem, quantity = 1): Promise<UserItem> {
    const guildId = member.guild.id;
    // Check available stock
    if (!item.inStock()) {
      throw new RaphError(Result.OutOfStock);
    }
    const userCurrency = await this._currencyService.getCurrency(member);
    if (userCurrency < item.price) {
      throw new RaphError(Result.TooPoor);
    }

    // Transfer money
    await this._currencyService.transferCurrency(
      member,
      this._clientService.getRaphtaliaMember(member.guild),
      item.price
    );

    // Subtract from guild stock
    const updatedItem = await this.subtractGuildStock(member.guild, item, quantity);
    if (!updatedItem) {
      throw new RaphError(Result.NotFound);
    }
    if (updatedItem.soldInCycle > 0) {
      await this.increaseGuildItemPrice(member.guild, updatedItem);
    }
    this._guildStoreService.update(member.guild);

    // Add it to player stock
    item.quantity = quantity;
    await this._userInventoryRepo.insertUserItem(guildId, member.id, item);

    return (await this._userInventoryRepo.getUserItem(guildId, member.id, item.id)) as UserItem;
  }

  public async getUserInventory(member: GuildMember): Promise<UserInventory> {
    return this._userInventoryRepo
      .getUserItems(member.guild.id, member.id)
      .then((items) => new UserInventory(member, items));
  }

  public async getUserItem(member: GuildMember, item: Item): Promise<UserItem | undefined> {
    return this._userInventoryRepo.getUserItem(member.guild.id, member.id, item.id);
  }

  public async getUserItemByCommand(
    member: GuildMember,
    commandName: string
  ): Promise<UserItem | undefined> {
    return this._userInventoryRepo.getUserItemByCommand(member.guild.id, member.id, commandName);
  }

  public async useItem(item: UserItem, member: GuildMember, uses: number): Promise<UserItem> {
    if (item.unlimitedUses) {
      return item;
    }

    item.remainingUses -= uses;

    // Check if quantity needs to be reduced
    const newQuantity = Math.ceil(item.remainingUses / item.maxUses);
    if (item.quantity !== newQuantity) {
      item.quantity = newQuantity;
      this._guildInventoryRepo.updateGuildItemQuantity(member.guild.id, item, uses);
    }

    this._guildStoreService.update(member.guild);
    return this.updateUserItem(item, member).then(() => {
      return item;
    });
  }

  public async updateUserItem(item: UserItem, member: GuildMember): Promise<void> {
    if (item.quantity === 0) {
      return this._userInventoryRepo.deleteUserItem(member.guild.id, member.id, item);
    }

    return this._userInventoryRepo.updateUserItem(member.guild.id, member.id, item);
  }

  public async transferItem(
    item: UserItem,
    fromMember: GuildMember,
    toMember: GuildMember
  ): Promise<void> {
    // Remove the item from the owner
    item.quantity -= 1;
    item.remainingUses -= item.maxUses;
    this.updateUserItem(item, fromMember);

    // Reset the item and give it to the receiver
    const givenItem = item.copy();
    givenItem.quantity = 1;
    givenItem.remainingUses = givenItem.maxUses;

    await this._userInventoryRepo.insertUserItem(fromMember.guild.id, toMember.id, givenItem);
  }

  public async findUsersWithItem(item: Item): Promise<UserItem[]> {
    return this._userInventoryRepo.findUsersWithItem(item.guildId, item.id);
  }
}
