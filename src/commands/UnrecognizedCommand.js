import Command from "./Command.js";

class UnrecognizedCommand extends Command {
  execute() {
    this.inputChannel.watchSend(`Unknown command "${this.message.command}"`);
  }
}

export default UnrecognizedCommand;
