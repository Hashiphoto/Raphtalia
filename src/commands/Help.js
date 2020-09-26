import Command from "./Command.js";

class Help extends Command {
  execute() {
    return this.inputChannel.watchSend(`Help yourself, ${this.sender}`).then(() => this.useItem());
  }
}

export default Help;
