import { GuildMember, Message, MessageOptions, TextChannel } from "discord.js";
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
  public aliases: string[];
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
