import { Format, print } from "../utilities/Util";
import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import GuildItem from "../models/GuildItem";
import InventoryService from "../services/Inventory.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Buy extends Command {
  public constructor(private _inventoryService?: InventoryService) {
    super();
    this.instructions =
      "**Buy**\nPurchase an item from the server store. The item will be added to your inventory, if there is adequate quantity in the store";
    this.usage = "Usage: `Buy (item name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.parsedContent);
  }

  public async execute(initiator: GuildMember, itemName: string): Promise<any> {
    // Get the guild item they are buying
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this._inventoryService?.findGuildItem(initiator.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        return this.reply(`There is more than one item with that name. Matches: ${error.message}`);
      }
      throw error;
    }
    if (!guildItem) {
      return this.reply(`There are no items named "${itemName}"`);
    }

    try {
      await this._inventoryService?.userPurchase(initiator, guildItem);
    } catch (error) {
      switch (error.result) {
        case Result.OutOfStock:
          return this.reply(`${guildItem.printName()} is currently out of stock`);
        case Result.TooPoor:
          return this.reply(
            `You do not have enough money to buy ${guildItem.printName()}. Current price: ${guildItem.printPrice()}`
          );
        default:
          return this.reply(`An error occurred purchasing the ${guildItem.printName()}`);
      }
    }

    this.channel &&
      (await this.channelService?.watchSend(
        this.channel,
        `Thank you for your purchase of ${print(
          guildItem.price,
          Format.Dollar
        )}!\n>>> ${guildItem.printName()} | Uses: ${guildItem.printMaxUses()}`
      ));
    await this.useItem(initiator, 1);
  }
}
