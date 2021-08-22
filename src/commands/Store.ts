import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import GuildStoreService from "../services/message/GuildStore.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Store extends Command {
  public constructor(private _guildStoreService?: GuildStoreService) {
    super();
    this.instructions = "**Store**\nPost the server store in this channel";
    this.usage = "Usage: `Store`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._guildStoreService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._guildStoreService?.postEmbed(this.channel);

    await this.useItem(initiator);
  }
}
