import Command from "./Command";
import { GuildMember } from "discord.js";
import GuildStoreService from "../services/message/GuildStore.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Store extends Command {
  /**
   * @param {Discord.Message} message
   * @param {GuildStoreService} storeStatusCtlr
   */
  public constructor() {
    super();
    this.instructions = "**Store**\nPost the server store in this channel";
    this.usage = "Usage: `Store`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    // Remove the current message and post the new one
    return this.ec.storeStatusController
      .removeMessage()
      .then(() => {
        return this.ec.storeStatusController.generateEmbed();
      })
      .then((storeEmbed) => {
        return this.ec.channel.send({ embed: storeEmbed });
      })
      .then((message) => {
        message.pin();
        return this.ec.storeStatusController.setMessage(message.id);
      })
      .then(() => this.useItem(initiator));
  }
}
