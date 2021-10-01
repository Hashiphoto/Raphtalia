import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import RoleListService from "../services/message/RoleList.service";
import Command from "./Command";

@autoInjectable()
export default class Roles extends Command {
  public constructor(
    @inject(delay(() => RoleListService)) private _roleListService?: RoleListService
  ) {
    super();
    this.name = "Roles";
    this.instructions = "Post the roles list for this server in this channel";
    this.usage = "`Roles`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.run(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<number | undefined> {
    // Remove the current message and post the new one
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._roleListService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._roleListService?.postEmbed(this.channel);

    return 1;
  }
}
