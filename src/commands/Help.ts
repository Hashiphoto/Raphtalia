import Command from "./Command";
import { GuildMember } from "discord.js";
import NullCommand from "./NullCommand";
import Raphtalia from "../Raphtalia";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Help extends Command {
  public constructor() {
    super();
    this.instructions = "**Help**\nGet detailed information about how to use any other command";
    this.usage = "Usage: `Help (command name)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    if (this.ec.messageHelper.args.length === 0) {
      return this.sendHelpMessage(this.instructions);
    }

    const commandName = this.ec.messageHelper.args[0];

    const command = Raphtalia.getCommandByName(this.ec, commandName.toLowerCase());

    if (command instanceof NullCommand) {
      return this.sendHelpMessage(`Unknown command "${commandName}"`);
    }

    return command.sendHelpMessage(command.instructions).then(() => this.useItem(initiator));
  }
}
