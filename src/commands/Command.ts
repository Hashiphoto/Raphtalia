import {
  ApplicationCommandData,
  GuildMember,
  Message,
  MessageOptions,
  TextChannel,
} from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import UserItem from "../models/UserItem";
import ChannelService from "../services/Channel.service";
import ClientService from "../services/Client.service";
import InventoryService from "../services/Inventory.service";
import { bold } from "../utilities/Util";

@autoInjectable()
export default class Command {
  public item: UserItem;
  public channel: TextChannel;
  public name: string;
  public aliases: string[] = [];
  public slashCommands: ApplicationCommandData[] = [];
  private _usage: string;
  private _instructions: string;

  public constructor(
    protected inventoryService?: InventoryService,
    protected channelService?: ChannelService,
    @inject(delay(() => ClientService)) protected clientService?: ClientService
  ) {}

  public get instructions(): string {
    return bold(this.name) + "\n" + this._instructions;
  }

  public set instructions(text: string) {
    this._instructions = text;
  }

  protected get usage(): string {
    return `Usage: ${this._usage}`;
  }

  protected set usage(text: string) {
    this._usage = text;
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    throw new RaphError(Result.ProgrammingError, "executeDefault not implemented");
  }

  /**
   * Harness for the command execution to handle item usage
   */
  public async run(initiator: GuildMember, ...params: any): Promise<any> {
    const item = await this.getOrBuyItem(initiator);
    if (!item) {
      return;
    }
    this.item = item;
    const itemUses = await this.execute(initiator, ...params);

    if (itemUses) {
      await this.useItem(initiator, itemUses);
    }
  }

  public async sendHelpMessage(pretext = ""): Promise<undefined> {
    await this.reply(pretext + "\n" + this.usage);
    return;
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

  public async execute(initiator: GuildMember, ...params: any): Promise<number | undefined> {
    throw new RaphError(Result.ProgrammingError, "execute not implemented");
  }

  protected async reply(content: string, options?: MessageOptions): Promise<Message | undefined> {
    if (!this.channel) {
      return;
    }
    return this.channelService?.watchSend(this.channel, { ...options, content });
  }

  protected async getOrBuyItem(initiator: GuildMember): Promise<UserItem | undefined> {
    if (!this.inventoryService) {
      throw new RaphError(Result.ProgrammingError, "Inventory service was null");
    }
    // See if the user owns it
    const userItem = await this.inventoryService.getUserItemByCommand(initiator, this.name);
    if (userItem) {
      console.log(
        `${initiator.displayName} is executing ${this.name} with owned item ${userItem.name}`
      );
      return userItem;
    }

    // Else, buy it for them
    const guildItem = await this.inventoryService.getGuildItemByCommand(
      initiator.guild.id,
      this.name
    );
    if (!guildItem) {
      return;
    }
    console.log(
      `Auto-purchasing item ${guildItem.name} for ${initiator.displayName} for command ${this.name}`
    );
    return this.inventoryService.userPurchase(initiator, guildItem).catch(async (error) => {
      let resultMessage = `You can't use the ${bold(
        this.name
      )} command because you don't own any ${guildItem.printName()}. Try using the Buy command.`;

      switch (error.result) {
        case Result.OutOfStock:
          resultMessage = `Could not auto-purchase ${guildItem.printName()} because it is currently out of stock`;
          break;
        case Result.TooPoor:
          resultMessage = `Could not auto-purchase ${guildItem.printName()} because you're too poor. Current price: ${guildItem.printPrice()}`;
          break;
      }
      await this.reply(resultMessage);
      return undefined;
    });
  }
}
