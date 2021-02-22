import BanList from "./BanList";
import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import Roles from "./Roles";
import Store from "./Store";

export default class ServerStatus extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**ServerStatus**\nPosts the ban list, role list, and store in this channel. " +
      "Equivalent to using the BanList, Roles, and Store commands consecutively.";
    this.usage = "Usage: `ServerStatus`";
  }

  public async execute(): Promise<any> {
    const banList = new BanList(this.ec);
    banList.item = this.item;
    const store = new Store(this.ec);
    store.item = this.item;
    const roles = new Roles(this.ec);
    roles.item = this.item;

    await banList.execute();
    await roles.execute();
    await store.execute();
  }
}
