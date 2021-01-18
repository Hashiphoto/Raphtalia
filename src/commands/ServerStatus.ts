import Command from "./Command.js";
import Discord from "discord.js";
import RoleStatusController from "../controllers/message/RoleStatusController.js";
import StoreStatusController from "../controllers/message/StoreStatusController.js";
import Store from "./Store.js";
import Roles from "./Roles.js";
import BanList from "./BanList.js";
import BanListStatusController from "../controllers/message/BanListStatusController.js";

class ServerStatus extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {RoleStatusController} roleStatusCtlr
   * @param {StoreStatusController} storeStatusCtlr
   * @param {BanListStatusController} banlistStatusCtlr
   */
  constructor(message, roleStatusCtlr, storeStatusCtlr, banlistStatusCtlr) {
    super(message);
    this.roleStatusCtlr = roleStatusCtlr;
    this.storeStatusCtlr = storeStatusCtlr;
    this.banlistStatusCtlr = banlistStatusCtlr;
    this.instructions =
      "**ServerStatus**\nPosts the ban list, role list, and store in this channel. " +
      "Equivalent to using the BanList, Roles, and Store commands consecutively.";
    this.usage = "Usage: `ServerStatus`";
  }

  async execute() {
    const banList = new BanList(this.message, this.banlistStatusCtlr)
      .setItem(this.item)
      .setInventoryController(this.inventoryController);
    const store = new Store(this.message, this.storeStatusCtlr)
      .setItem(this.item)
      .setInventoryController(this.inventoryController);
    const roles = new Roles(this.message, this.roleStatusCtlr)
      .setItem(this.item)
      .setInventoryController(this.inventoryController);

    return banList
      .execute()
      .then(() => roles.execute())
      .then(() => store.execute());
  }
}

export default ServerStatus;
