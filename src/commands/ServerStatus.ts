import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import BanList from "./BanList";
import Command from "./Command";
import Roles from "./Roles";
import Store from "./Store";

@autoInjectable()
export default class ServerStatus extends Command {
  public constructor() {
    super();
    this.name = "ServerStatus";
    this.instructions =
      "Posts the ban list, role list, and store in this channel. " +
      "Equivalent to using the BanList, Roles, and Store commands consecutively.";
    this.usage = "`ServerStatus`";
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
    const banList = new BanList();
    const store = new Store();
    const roles = new Roles();
    banList.channel = this.channel;
    store.channel = this.channel;
    roles.channel = this.channel;
    banList.item = this.item;
    store.item = this.item;
    roles.item = this.item;

    await banList.execute(initiator);
    await roles.execute(initiator);
    await store.execute(initiator);

    return 1;
  }
}
