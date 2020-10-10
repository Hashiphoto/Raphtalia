import Discord from "discord.js";
import UserItem from "../structures/UserItem.js";
import InventoryController from "../controllers/InventoryController.js";
import CommandParser from "../CommandParser.js";

class Command {
  /**
   * @param {Discord.Message} message - The message sent to issue this command
   */
  constructor(message) {
    this.message = message;
    this.sender = message.sender;
    this.inputChannel = message.channel;
    this.reply = this.inputChannel.watchSend;
    this.guild = message.guild;
    this.item;
    this.sender.hasAuthorityOver = (input) => {
      const isHigher = (member, otherMember) => {
        return (
          member.id != otherMember.id &&
          member.highestRole.comparePositionTo(otherMember.highestRole) > 0
        );
      };
      if (Array.isArray(input)) {
        return input.every((target) => isHigher(this.sender, target));
      }
      return isHigher(this.sender, input);
    };
    this.instructions = "";
    this.usage = "";
  }

  userCanExecute() {
    return true;

    // Move logic into an InventoryController
    // Get the user's inventory
    //
  }

  execute() {
    throw new Error("Implement this function");
  }

  sendHelpMessage(pretext = "") {
    return this.inputChannel.watchSend(pretext + "\n" + this.usage);
  }

  /**
   * @param {InventoryController} ic
   */
  setInventoryController(ic) {
    this.inventoryController = ic;
    return this;
  }

  useItem(uses = 1) {
    const oldQuantity = this.item.quantity;
    return this.inventoryController
      .useItem(this.item, this.message.sender, uses)
      .then((newItem) => {
        if (newItem && newItem.quantity < oldQuantity) {
          return this.inputChannel.watchSend(
            `Your ${newItem.printName()} broke! You have ${newItem.quantity} remaining.\n`
          );
        }
      });
  }

  /**
   * @param {UserItem} item
   */
  setItem(item) {
    this.item = item;
    return this;
  }

  sum(total, value) {
    return total + value;
  }
}

export default Command;
