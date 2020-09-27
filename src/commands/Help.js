import Command from "./Command.js";

class Help extends Command {
  constructor(message) {
    super(message);
    this.instructions = "**Help**\nGet detailed information about how to use any other command";
    this.usage = "Usage: `Help (command name)`";
  }

  execute() {
    return this.sendHelpMessage(this.instructions);
  }
}

export default Help;
