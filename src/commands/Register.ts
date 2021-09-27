import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import RoleService from "../services/Role.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Register extends Command {
  public constructor(private _roleService?: RoleService) {
    super();
    this.name = "Register";
    this.instructions =
      "Give the voter role to yourself. " +
      "This will allow you to vote when anyone uses the HoldVote command";
    this.usage = "`Register`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    if (!this._roleService) {
      throw new RaphError(Result.ProgrammingError);
    }
    const voterRole = await this._roleService?.getCreateVoterRole(initiator.guild);

    if (initiator.roles.cache.has(voterRole.id)) {
      return this.reply(`You are already a registered voter`);
    }

    await initiator.roles.add(voterRole);
    await this.reply(`You are now a registered voter!`);
    await this.useItem(initiator);
  }
}
