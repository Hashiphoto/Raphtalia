import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import RoleUtil from "../../services/RoleUtil";

export default class Register extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Register**\nGive the voter role to yourself. " +
      "This will allow you to vote when anyone uses the HoldVote command";
    this.usage = "Usage: `Register`";
  }

  public async execute(): Promise<any> {
    const voterRole = await RoleUtil.ensureVoterRole(this.ec.guild);

    if (this.ec.initiator.roles.cache.has(voterRole.id)) {
      return this.ec.channelHelper.watchSend(`You are already a registered voter, dingus`);
    }

    return this.ec.initiator.roles
      .add(voterRole)
      .then(() => {
        this.ec.channelHelper.watchSend(`You are now a registered voter!`);
      })
      .then(() => this.useItem());
  }
}
