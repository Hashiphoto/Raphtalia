import {
  ApplicationCommandData,
  GuildMember,
  Message,
  MessageOptions,
  PartialTextBasedChannelFields,
} from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import CommandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import UserItem from "../models/UserItem";
import ChannelService from "../services/Channel.service";
import ClientService from "../services/Client.service";
import InventoryService from "../services/Inventory.service";
import RoleService from "../services/Role.service";
import { bold } from "../utilities/Util";

@autoInjectable()
export default class Command<T extends ICommandProps> {
  public item: UserItem;
  public channel: PartialTextBasedChannelFields;
  public name: string;
  public aliases: string[] = [];
  public slashCommands: ApplicationCommandData[] = [];
  public itemRequired = true;
  public leaderOnly = false;
  protected queuedText = "";
  private _instructions: string;

  public constructor(
    protected inventoryService?: InventoryService,
    protected channelService?: ChannelService,
    @inject(delay(() => ClientService)) protected clientService?: ClientService,
    @inject(delay(() => RoleService)) protected roleService?: RoleService
  ) {}

  public get instructions(): string {
    return bold(this.name) + "\n" + this._instructions;
  }

  public set instructions(text: string) {
    this._instructions = text;
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    throw new RaphError(Result.ProgrammingError, "executeDefault not implemented");
  }

  /**
   * Harness for the command execution to handle item usage
   */
  public async runWithItem(props: T): Promise<any> {
    console.log(`${props.initiator.displayName} executing ${this.name}`);

    // Check for exile
    const guild = props.initiator.guild;
    const exileRole = await this.roleService?.getCreateExileRole(guild);
    if (exileRole && props.initiator.roles.cache.find((r) => r.id === exileRole.id)) {
      this.reply(`You cannot use commands while in exile`);
      return;
    }

    if (this.itemRequired) {
      const item = await this.getOrBuyItem(props.initiator);
      if (!item) {
        return this.reply("");
      }
      this.item = item;
    }

    const itemUses = await this.execute(props);

    if (this.itemRequired && itemUses) {
      await this.useItem(props.initiator, itemUses);
    }
    if (this.queuedText.length) {
      await this.flushMessageQueue();
    }
  }

  /**
   * Do the command operation. Returns the number of item uses used
   */
  public async execute(props: T): Promise<number | undefined> {
    throw new RaphError(Result.ProgrammingError, "execute not implemented");
  }

  public async sendHelpMessage(pretext = ""): Promise<undefined> {
    this.queueReply(this.instructions);
    return;
  }

  public async useItem(itemOwner: GuildMember, uses = 1): Promise<void> {
    if (!this.item) {
      return;
    }
    const oldQuantity = this.item.quantity;
    const updatedItem = await this.inventoryService?.useItem(this.item, itemOwner, uses);

    if (updatedItem && updatedItem.quantity < oldQuantity) {
      this.queueReply(`Your ${updatedItem.printName()} broke!`);
    }
  }

  public async flushMessageQueue(): Promise<Message | undefined> {
    if (!this.channel || !this.queuedText.length) {
      return;
    }
    return this.channelService
      ?.watchSend(this.channel, {
        content: this.queuedText,
      })
      .then((message) => {
        this.queuedText = "";
        return message;
      });
  }

  protected queueReply(content: string): void {
    this.queuedText += content + "\n";
  }

  protected async reply(content: string, options?: MessageOptions): Promise<Message | undefined> {
    if (!this.channel) {
      return;
    }
    return this.channelService
      ?.watchSend(this.channel, {
        ...options,
        content: this.queuedText + content,
      })
      .then((message) => {
        this.queuedText = "";
        return message;
      });
  }

  protected async getOrBuyItem(initiator: GuildMember): Promise<UserItem | undefined> {
    if (!this.inventoryService) {
      throw new RaphError(Result.ProgrammingError, "Inventory service was null");
    }
    // See if the user owns it
    const userItems = await this.inventoryService.getUserItemByCommand(initiator, this.name);
    if (userItems.length) {
      // Use the item with the least remaining uses
      return userItems[0];
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
    return this.inventoryService
      .userPurchase(initiator, guildItem)
      .then((userItem) => {
        this.queueReply(`Auto-purchased a ${guildItem.printName()} for ${guildItem.printPrice()}`);
        return userItem;
      })
      .catch(async (error) => {
        let resultMessage: string;

        const autoPurchaseError = `You need a ${guildItem.printName()} to execute this command. Could not auto-purchase one for you because`;
        switch (error.result) {
          case Result.OutOfStock:
            resultMessage = `${autoPurchaseError} it is currently out of stock`;
            break;
          case Result.TooPoor:
            resultMessage = `${autoPurchaseError} you're too poor. Current price: ${guildItem.printPrice()}`;
            break;
          default:
            resultMessage = `You can't use the ${bold(
              this.name
            )} command because you don't own any ${guildItem.printName()}. Try using the Buy command.`;
        }
        this.queueReply(resultMessage);
        return undefined;
      });
  }
}
