import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import RaphError from "../../models/RaphError";
import { Result } from "../../enums/Result";
import RoleService from "../../services/Role.service";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Register extends Command<ICommandProps> {
  public constructor(private _roleService?: RoleService) {
    super();
    this.name = "Register";
    this.instructions =
      "Give the voter role to yourself. " +
      "This will allow you to vote when anyone uses the HoldVote command";
    this.usage = "`Register`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    if (!this._roleService) {
      throw new RaphError(Result.ProgrammingError);
    }
    const voterRole = await this._roleService?.getCreateVoterRole(initiator.guild);

    if (initiator.roles.cache.has(voterRole.id)) {
      await this.reply(`You are already a registered voter`);
      return;
    }

    await initiator.roles.add(voterRole);
    await this.reply(`You are now a registered voter!`);
    return 1;
  }
}
