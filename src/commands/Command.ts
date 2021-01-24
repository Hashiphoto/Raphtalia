import { DMChannel, Guild, Message, NewsChannel, TextChannel } from "discord.js";

import CommandParser from "../CommandParser.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import UserItem from "../structures/UserItem.js";

export default class Command {
  public item: UserItem;

  protected ec: ExecutionContext;
  protected instructions: string;
  protected usage: string;

  public constructor(context: ExecutionContext) {
    this.ec = context;

    this.sender.hasAuthorityOver = (input) => {
      /**
       * @param {Discord.GuildMember} member
       * @param {Discord.GuildMember} otherMember
       */
      const isHigher = (member, otherMember) => {
        return (
          member.id != otherMember.id &&
          member.roles.highest.comparePositionTo(otherMember.roles.highest) > 0
        );
      };
      if (Array.isArray(input)) {
        return input.every((target) => isHigher(this.sender, target));
      }
      return isHigher(this.sender, input);
    };
  }

  /**
   * @returns {Boolean} Whether the store needs to be updated or not
   */
  public execute(): Promise<any> {
    throw new Error("Implement this function");
  }

  public sendHelpMessage(pretext = "") {
    return this.ec.channelHelper.watchSend(pretext + "\n" + this.usage);
  }

  /**
   * @param {Number} uses
   * @returns {Boolean} Whether the store needs to be updated or not
   */
  public useItem(uses = 1) {
    const oldQuantity = this.item.quantity;
    return this.inventoryController
      .useItem(this.item, this.message.sender, uses)
      .then((newItem) => {
        if (newItem && newItem.quantity < oldQuantity) {
          return this.inputChannel
            .watchSend(
              `Your ${newItem.printName()} broke! You have ${newItem.quantity} remaining.\n`
            )
            .then(() => true);
        }
        return false;
      });
  }

  public sum(total, value) {
    return total + value;
  }
}
