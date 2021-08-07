import Command from "./Command";
import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Roles extends Command {
  public constructor() {
    super();
    this.instructions = "**Roles**\nPost the roles list for this server in this channel";
    this.usage = "Usage: `Roles`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    // Remove the current message and post the new one
    return this.ec.roleStatusController
      .removeMessage()
      .then(() => {
        return this.ec.roleStatusController.generateEmbed();
      })
      .then((roleEmbed) => {
        return this.ec.channel.send({ embed: roleEmbed });
      })
      .then((message) => {
        message.pin();
        return this.ec.roleStatusController.setMessage(message.id);
      })
      .then(() => this.useItem(initiator));
  }
}
