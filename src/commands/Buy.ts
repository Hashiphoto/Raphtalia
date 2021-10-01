import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import GuildItem from "../models/GuildItem";
import RaphError from "../models/RaphError";
import InventoryService from "../services/Inventory.service";
import { Format, print } from "../utilities/Util";
import Command from "./Command";

@autoInjectable()
export default class Buy extends Command {
  public constructor(private _inventoryService?: InventoryService) {
    super();
    this.name = "Buy";
    this.instructions =
      "Purchase an item from the server store. The item will be added to your inventory, if there is adequate quantity in the store";
    this.usage = "`Buy (item name)`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member, cmdMessage.parsedContent);
  }

  public async execute(initiator: GuildMember, itemName: string): Promise<number | undefined> {
    // Get the guild item they are buying
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this._inventoryService?.findGuildItem(initiator.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        await this.reply(`There is more than one item with that name. Matches: ${error.message}`);
        return;
      }
      throw error;
    }
    if (!guildItem) {
      await this.reply(`There are no items named "${itemName}"`);
      return;
    }

    try {
      await this._inventoryService?.userPurchase(initiator, guildItem);
    } catch (error) {
      switch (error.result) {
        case Result.OutOfStock:
          await this.reply(`${guildItem.printName()} is currently out of stock`);
          return;
        case Result.TooPoor:
          await this.reply(
            `You do not have enough money to buy ${guildItem.printName()}. Current price: ${guildItem.printPrice()}`
          );
          return;
        default:
          await this.reply(`An error occurred purchasing the ${guildItem.printName()}`);
          return;
      }
    }

    this.reply(
      `Thank you for your purchase of ${print(
        guildItem.price,
        Format.Dollar
      )}!\n>>> ${guildItem.printName()} | Uses: ${guildItem.printMaxUses()}`
    );
    return 1;
  }
}
