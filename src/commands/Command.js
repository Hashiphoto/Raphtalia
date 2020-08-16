import Discord from "discord.js";

class Command {
  message;
  sender;
  inputChannel;
  db;

  /**
   * @param {Discord.Message} message - The message sent to issue this command
   */
  constructor(message, db) {
    this.message = message;
    this.sender = message.sender;
    this.inputChannel = message.channel;
    this.db = db;
  }

  userCanExecute() {
    return true;
    // TODO: Check if the user has a role that would allow
    // them to use this command
  }

  execute() {
    throw new Error("Implement this function");
  }
}

export default Command;
