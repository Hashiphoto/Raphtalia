import { GuildMember } from "discord.js";
import { autoInjectable } from "tsyringe";
import BanList from "./BanList";
import Command from "./Command";
import Roles from "./Roles";
import Store from "./Store";

@autoInjectable()
export default class ServerStatus extends Command {
  public constructor() {
    super();
    this.instructions =
      "**ServerStatus**\nPosts the ban list, role list, and store in this channel. " +
      "Equivalent to using the BanList, Roles, and Store commands consecutively.";
    this.usage = "Usage: `ServerStatus`";
  }


  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }
  
  public async execute(initiator: GuildMember): Promise<any> {
    const banList = new BanList(this.ec);
    banList.item = this.item;
    const store = new Store(this.ec);
    store.item = this.item;
    const roles = new Roles(this.ec);
    roles.item = this.item;

    await banList.execute(initiator: GuildMember);
    await roles.execute(initiator: GuildMember);
    await store.execute(initiator: GuildMember);
  }
}
