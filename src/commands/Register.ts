import Command from "./Command";
import { GuildMember } from "discord.js";
import RoleService from "../services/Role.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Register extends Command {
  public constructor() {
    super();
    this.instructions =
      "**Register**\nGive the voter role to yourself. " +
      "This will allow you to vote when anyone uses the HoldVote command";
    this.usage = "Usage: `Register`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    const voterRole = await RoleService.ensureVoterRole(this.ec.guild);

    if (initiator.roles.cache.has(voterRole.id)) {
      return this.reply(`You are already a registered voter, dingus`);
    }

    return initiator.roles
      .add(voterRole)
      .then(() => {
        this.reply(`You are now a registered voter!`);
      })
      .then(() => this.useItem(initiator));
  }
}
