import Discord from "discord.js";

class Command {
  message;
  sender;
  inputChannel;
  db;
  guild;

  /**
   * @param {Discord.Message} message - The message sent to issue this command
   */
  constructor(message, db) {
    this.message = message;
    this.sender = message.sender;
    this.inputChannel = message.channel;
    this.db = db;
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
}

export default Command;
