import { Guild as DsGuild, GuildMember } from "discord.js";
import { delay, inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import GuildItem from "../models/GuildItem";
import { Purchase } from "../models/Purchase";
import RaphError from "../models/RaphError";
import UserInventory from "../models/UserInventory";
import UserItem from "../models/UserItem";
import GuildInventoryRepository from "../repositories/GuildInventory.repository";
import UserInventoryRepository from "../repositories/UserInventory.repository";
import ClientService from "./Client.service";
import CurrencyService from "./Currency.service";
import GuildService from "./Guild.service";
import GuildStoreService from "./message/GuildStore.service";

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

  public async subtractGuildStock(item: GuildItem, quantity: number): Promise<GuildItem> {
    if (item.unlimitedQuantity) {
      // Record how many are sold
      await this._guildInventoryRepo.updateGuildItemSold(item.guildId, item, quantity, new Date());
    } else {
      // Update the quantity AND how many are sold
      await this._guildInventoryRepo.updateGuildItemQuantity(item, -quantity);
    }

    return this._guildInventoryRepo.getGuildItem(item.guildId, item.itemId);
  }

  public async increaseGuildItemPrice(guildItem: GuildItem, quantityChange: number): Promise<void> {
    const dbGuild = await this._guildService.getGuild(guildItem.guildId);
    if (!dbGuild) {
      return;
    }

    let priceMultiplier = 0;
    const baseSoldInCycle = guildItem.soldInCycle - quantityChange; // The number sold PRIOR to the current purchase
    for (let i = 0; i < quantityChange; i++) {
      // If the user bought multiple of an item, we don't want to increase the price exponentially
      // Add all the multipliers together instead
      priceMultiplier += Math.exp((baseSoldInCycle + i) * dbGuild.priceHikeCoefficient);
    }

    if (priceMultiplier <= 1) {
      return;
    }

    const newPrice = guildItem.price * priceMultiplier;

    await this._guildInventoryRepo.updateGuildItemPrice(guildItem.guildId, guildItem, newPrice);
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
  public async userPurchase(member: GuildMember, item: GuildItem, quantity = 1): Promise<Purchase> {
    const guildId = member.guild.id;
    // Check available stock
    if (!item.inStock()) {
      throw new RaphError(Result.OutOfStock);
    }
    // Ensure user can purchase it
    const userCurrency = await this._currencyService.getCurrency(member);
    if (userCurrency < item.price) {
      throw new RaphError(Result.TooPoor);
    }

    const purchaseableQuantity = Math.min(quantity, item.quantity);
    const cost = item.price * purchaseableQuantity;

    // Subtract from guild stock
    const updatedItem = await this.subtractGuildStock(item, purchaseableQuantity);
    if (!updatedItem) {
      throw new RaphError(Result.NotFound);
    }
    if (updatedItem.soldInCycle > 0) {
      await this.increaseGuildItemPrice(updatedItem, purchaseableQuantity);
    }
    this._guildStoreService.update(member.guild);

    // Add it to the player inventory
    const newItems = await this._userInventoryRepo.createUserItem(
      guildId,
      member.id,
      {
        itemId: item.itemId,
        maxUses: item.maxUses,
        quantity: 1,
      },
      purchaseableQuantity
    );

    // Transfer money
    await this._currencyService.transferCurrency(
      member,
      this._clientService.getRaphtaliaMember(member.guild),
      cost
    );

    return {
      items: newItems.sort(this.byRemainingUses),
      cost,
    };
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

  public async useItem(
    item: UserItem,
    member: GuildMember,
    uses: number
  ): Promise<UserItem | undefined> {
    if (item.unlimitedUses) {
      return item;
    }

    item.remainingUses -= uses;
    if (item.remainingUses <= 0) {
      item.quantity -= 1;
    }

    if (item.quantity <= 0) {
      await this.returnItemToStore(member.guild, item);
      return item;
    } else {
      await this.updateUserItem(item);
      return item;
    }
  }

  public async returnItemToStore(guild: DsGuild, item: UserItem): Promise<void> {
    await this._userInventoryRepo.deleteUserItem(item);
    await this._guildInventoryRepo
      .updateGuildItemQuantity(item, 1)
      .then(() => this._guildStoreService.update(guild));
  }

  public async bulkReturnItemsToStore(guild: DsGuild, items: UserItem[]): Promise<void> {
    await this._userInventoryRepo.deleteUserItems(guild.id, items);
    const groupedItems = UserInventory.groupItems(items);
    await Promise.all(
      groupedItems.map((items) => {
        const aggregate = items[0].copy();
        const quantity = items.reduce((sum, current) => sum + current.quantity, 0);
        return this._guildInventoryRepo.updateGuildItemQuantity(aggregate, quantity);
      })
    ).then(() => this._guildStoreService.update(guild));
  }

  public async updateUserItem(item: UserItem): Promise<void> {
    await this._userInventoryRepo.updateUserItem(item.guildId, item);
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
