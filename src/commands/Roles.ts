import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import RoleListService from "../services/message/RoleList.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Roles extends Command {
  public constructor(private _roleListService?: RoleListService) {
    super();
    this.instructions = "**Roles**\nPost the roles list for this server in this channel";
    this.usage = "Usage: `Roles`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    // Remove the current message and post the new one
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._roleListService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._roleListService?.postEmbed(this.channel);

    await this.useItem(initiator);
  }
}
