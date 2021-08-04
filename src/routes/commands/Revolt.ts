import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";

/**
 * @todo Finish this
 */
export default class Revolt extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Revolt**\nDoesn't do anything";
    this.usage = "Usage: `Revolt`";
  }

  public async execute(): Promise<any> {
    return this.ec.channelHelper.watchSend("This feature hasn't been developed yet");
  }
}
