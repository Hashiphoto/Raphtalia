import Command from "./Command.js";

class NullCommand extends Command {
  constructor(message, text) {
    super(message);

    this.text = text;
  }

  execute() {
    return this.inputChannel.watchSend(this.text);
  }
}

export default NullCommand;
