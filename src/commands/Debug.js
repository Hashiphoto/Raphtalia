import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Debug extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions = "For testing in development only";
    this.usage = "Usage: `Debug (options)`";
  }

  async execute() {
    const args = this.message.args;
    if (args.length === 0) {
      return this.sendHelpMessage();
    }
    switch (args[0].toLowerCase()) {
      case "resolvecontests":
        return this.memberController
          .resolveRoleContests()
          .then((responses) => responses.reduce(this.sum))
          .then((feedback) => this.inputChannel.watchSend(feedback));
      case "store":
        const itemArgs = this.message.content
          .slice(this.message.content.indexOf("store") + 5)
          .split(",")
          .map((arg) => arg.trim());
        if (itemArgs.length < 5) {
          return this.inputChannel.watchSend(
            "Please provide all 5 arguments (search, name, price, uses, quantity)"
          );
        }
        const searchTerm = itemArgs[0];
        const newName = itemArgs[1];
        const newPrice = itemArgs[2];
        const newUses = itemArgs[3];
        const newQuantity = itemArgs[4];

        const item = await this.inventoryController.getGuildItem(searchTerm);
        if (!item) {
          return this.inputChannel.watchSend("Couldn't find that item");
        }
        if (newName !== "") {
          item.name = newName;
        }
        if (newPrice !== "") {
          item.price = newPrice;
        }
        if (newUses !== "") {
          item.maxUses = newUses;
        }
        if (newQuantity !== "") {
          item.quantity += newQuantity - item.maxQuantity;
          item.maxQuantity = newQuantity;
        }

        return this.inventoryController.updateGuildItem(item).then(() => {
          return this.inputChannel.watchSend("Item updated");
        });
      default:
        return this.sendHelpMessage();
    }
  }
}

export default Debug;
