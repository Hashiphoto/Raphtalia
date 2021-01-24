import Command from "./Command.js";

class NullCommand extends Command {
  constructor(message, text) {
    super(message);

    this.text = text;
  }

  execute(): Promise<any> {
    return this.ec.channelHelper.watchSend(this.text);
  }
}

export default NullCommand;
