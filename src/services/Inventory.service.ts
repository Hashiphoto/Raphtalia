import { Guild as DsGuild, GuildMember } from "discord.js";
import { delay, inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import GuildItem from "../models/GuildItem";
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
    return this._guildInventoryRepo.getGuildItem(item.guildId, item.itemId);
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

  public async findUserItem(member: GuildMember, name: string): Promise<UserItem[]> {
    const userItems = await this._userInventoryRepo.findUserItemByName(
      member.guild.id,
      member.id,
      name
    );
    return (userItems ?? []).sort(this.byRemainingUses);
  }

  /**
   * Purchase an item from the store, taking into account cost and available quantity
   */
  public async userPurchase(
    member: GuildMember,
    item: GuildItem,
    quantity = 1
  ): Promise<UserItem | undefined> {
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
    const newItemId = await this._userInventoryRepo.createUserItem(guildId, member.id, item);

    return this._userInventoryRepo.getUserItem(newItemId);
  }

  public async getAllUserItems(guild: DsGuild, showHidden = false): Promise<UserItem[]> {
    return this._userInventoryRepo
      .listUserItems(guild.id, undefined, showHidden)
      .then((items) => items.sort(this.byRemainingUses));
  }

  public async getUserInventory(member: GuildMember): Promise<UserInventory> {
    return this._userInventoryRepo
      .listUserItems(member.guild.id, member.id)
      .then((items) => new UserInventory(member, items.sort(this.byRemainingUses)));
  }

  public async getUserItems(member: GuildMember, item: GuildItem): Promise<UserItem[]> {
    return this._userInventoryRepo
      .getUserItemsByItemId(member.guild.id, member.id, item.itemId)
      .then((items) => items.sort(this.byRemainingUses));
  }

  public async getUserItemByCommand(member: GuildMember, commandName: string): Promise<UserItem[]> {
    return this._userInventoryRepo
      .getUserItemsByCommand(member.guild.id, member.id, commandName)
      .then((items) => items.sort(this.byRemainingUses));
  }

  public async useItem(item: UserItem, member: GuildMember, uses: number): Promise<UserItem> {
    if (item.unlimitedUses) {
      return item;
    }

    item.remainingUses -= uses;

    // Item is used up. Return to store
    if (item.remainingUses <= 0) {
      item.quantity -= 1;
      this._guildInventoryRepo.updateGuildItemQuantity(member.guild.id, item, uses);
      // Update the store message
      this._guildStoreService.update(member.guild);
    }

    return this.updateUserItem(item).then(() => {
      return item;
    });
  }

  public async updateUserItem(item: UserItem): Promise<void> {
    if (item.quantity === 0) {
      return this._userInventoryRepo.deleteUserItem(item.guildId, item.userId, item);
    }

    return this._userInventoryRepo.updateUserItem(item.guildId, item.userId, item);
  }

  public async insertUserItem(item: UserItem): Promise<void> {
    return this._userInventoryRepo.insertUserItem(item.guildId, item.userId, item);
  }

  public async transferItem(item: UserItem, toMember: GuildMember): Promise<void> {
    await this._userInventoryRepo.transferUserItem(toMember.id, item);
  }

  public async findUsersWithItem(item: GuildItem): Promise<UserItem[]> {
    return this._userInventoryRepo
      .findUsersWithItem(item.guildId, item.itemId)
      .then((items) => items.sort(this.byRemainingUses));
  }

  private byRemainingUses = (a: UserItem, b: UserItem) =>
    a.userId.localeCompare(b.userId) || a.remainingUses - b.remainingUses;
}
