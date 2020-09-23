import Discord from "discord.js";
import AuthorityError from "../structures/AuthorityError.js";

class Command {
  /**
   * @param {Discord.Message} message - The message sent to issue this command
   */
  constructor(message) {
    this.message = message;
    this.sender = message.sender;
    this.inputChannel = message.channel;
    this.guild = message.guild;
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

  sendHelpMessage() {
    // TODO: Make this required to implement
  }

  sum(total, value) {
    return total + value;
  }
}

export default Command;
