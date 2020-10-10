import Raphtalia from "../Raphtalia.js";
import Command from "./Command.js";
import NullCommand from "./NullCommand.js";

class Help extends Command {
  constructor(message) {
    super(message);
    this.instructions = "**Help**\nGet detailed information about how to use any other command";
    this.usage = "Usage: `Help (command name)`";
  }

  execute() {
    if (this.message.args.length === 0) {
      return this.sendHelpMessage(this.instructions);
    }

    const command = Raphtalia.getCommandByName(
      this.message.args[0].toLowerCase(),
      this.message,
      null
    );

    if (command instanceof NullCommand) {
      return this.sendHelpMessage(`Unknown command "${this.message.args[0]}"`);
    }

    return command.sendHelpMessage(command.instructions);
  }
}

export default Help;
