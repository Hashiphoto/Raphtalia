import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import NullCommand from "./NullCommand";
import Raphtalia from "../../Raphtalia";

export default class Help extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Help**\nGet detailed information about how to use any other command";
    this.usage = "Usage: `Help (command name)`";
  }

  public async execute(): Promise<any> {
    if (this.ec.messageHelper.args.length === 0) {
      return this.sendHelpMessage(this.instructions);
    }

    const commandName = this.ec.messageHelper.args[0];

    const command = Raphtalia.getCommandByName(this.ec, commandName.toLowerCase());

    if (command instanceof NullCommand) {
      return this.sendHelpMessage(`Unknown command "${commandName}"`);
    }

    return command.sendHelpMessage(command.instructions).then(() => this.useItem());
  }
}
