import Command from "./Command.js";
import Discord from "discord.js";
import RoleStatusController from "../controllers/RoleStatusController.js";
import StoreStatusController from "../controllers/StoreStatusController.js";
import Store from "./Store.js";
import Roles from "./Roles.js";

class ServerStatus extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {RoleStatusController} roleStatusCtlr
   * @param {StoreStatusController} storeStatusCtlr
   */
  constructor(message, roleStatusCtlr, storeStatusCtlr) {
    super(message);
    this.roleStatusCtlr = roleStatusCtlr;
    this.storeStatusCtlr = storeStatusCtlr;
    this.instructions =
      "**ServerStatus**\nPosts the role list and store in this channel. " +
      "Equivalent to using Roles and Store commands consecutively.";
    this.usage = "Usage: `ServerStatus`";
  }

  async execute() {
    const store = new Store(this.message, this.storeStatusCtlr)
      .setItem(this.item)
      .setInventoryController(this.inventoryController);
    const roles = new Roles(this.message, this.roleStatusCtlr)
      .setItem(this.item)
      .setInventoryController(this.inventoryController);

    return roles.execute().then(() => store.execute());
  }
}

export default ServerStatus;
