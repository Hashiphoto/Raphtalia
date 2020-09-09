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
  }

  userCanExecute() {
    return true;
    // TODO: Check if the user has a role that would allow
    // them to use this command
  }

  execute() {
    throw new Error("Implement this function");
  }

  sendHelpMessage() {
    // TODO: Make this required to implement
  }

  hasAuthorityOver(target) {
    if (
      this.sender.id != target.id &&
      this.sender.highestRole.comparePositionTo(target.highestRole) > 0
    ) {
      return Promise.resolve();
    }
    return Promise.reject(new AuthorityError());
  }
}

export default Command;
