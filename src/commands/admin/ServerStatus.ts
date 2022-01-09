import BanList from "./BanList";
import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import RaphError from "../../models/RaphError";
import { Result } from "../../enums/Result";
import Roles from "./Roles";
import Store from "./Store";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class ServerStatus extends Command<ICommandProps> {
  public constructor() {
    super();
    this.name = "ServerStatus";
    this.instructions =
      "Posts the ban list, role list, and store in this channel. " +
      "Equivalent to using the BanList, Roles, and Store commands consecutively.";
    this.usage = "`ServerStatus`";
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
    const banList = new BanList();
    const store = new Store();
    const roles = new Roles();
    banList.channel = this.channel;
    store.channel = this.channel;
    roles.channel = this.channel;
    banList.item = this.item;
    store.item = this.item;
    roles.item = this.item;

    await banList.execute({ initiator });
    await roles.execute({ initiator });
    await store.execute({ initiator });

    return 1;
  }
}
