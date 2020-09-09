import Command from "./Command.js";

class Help extends Command {
  execute() {
    return this.inputChannel.watchSend(`Help yourself, ${this.sender}`);
  }
}

export default Help;
