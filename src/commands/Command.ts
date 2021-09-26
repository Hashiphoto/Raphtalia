import { GuildMember, Message, MessageOptions, TextChannel } from "discord.js";

import ChannelService from "../services/Channel.service";
import CommmandMessage from "../models/CommandMessage";
import InventoryService from "../services/Inventory.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import UserItem from "../models/UserItem";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Command {
  public item: UserItem;
  public instructions: string;
  public channel: TextChannel;
  public name: string;
  protected usage: string;

  public constructor(
    protected inventoryService?: InventoryService,
    protected channelService?: ChannelService
  ) {
    this.name = "Command";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    throw new RaphError(Result.ProgrammingError, "executeDefault not implemented");
  }

  public async execute(...params: any): Promise<void> {
    throw new RaphError(Result.ProgrammingError, "execute not implemented");
  }

  public async sendHelpMessage(pretext = ""): Promise<Message | undefined> {
    return this.reply(pretext + "\n" + this.usage);
  }

  public async useItem(itemOwner: GuildMember, uses = 1): Promise<void> {
    const oldQuantity = this.item.quantity;
    const updatedItem = await this.inventoryService?.useItem(this.item, itemOwner, uses);

    if (updatedItem && updatedItem.quantity < oldQuantity) {
      await this.reply(
        `Your ${updatedItem.printName()} broke! You have ${updatedItem.quantity} remaining.\n`
      );
    }
  }

  protected async reply(content: string, options?: MessageOptions): Promise<Message | undefined> {
    if (!this.channel) {
      return;
    }
    return this.channelService?.watchSend(this.channel, { ...options, content });
  }
}
