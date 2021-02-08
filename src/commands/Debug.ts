import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";

export default class Debug extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "For testing in development only";
    this.usage = "Usage: `Debug (options)`";
  }

  public async execute(): Promise<any> {
    const args = this.ec.messageHelper.args;
    if (args.length === 0) {
      return this.sendHelpMessage();
    }
    switch (args[0].toLowerCase()) {
      case "resolvecontests":
        return this.ec.memberController
          .resolveRoleContests(true)
          .then((responses) => responses.reduce(this.sum))
          .then((feedback) => this.ec.channelHelper.watchSend(feedback));
      case "store":
        const itemArgs = this.ec.messageHelper.parsedContent
          .slice(this.ec.messageHelper.parsedContent.indexOf("store") + 5)
          .split(",")
          .map((arg) => arg.trim());
        if (itemArgs.length < 5) {
          return this.ec.channelHelper.watchSend(
            "Please provide all 5 arguments (search, name, price, uses, quantity)"
          );
        }

        const [searchTerm, newName, newPrice, newUses, newQuantity] = itemArgs;
        const item = await this.ec.inventoryController.getGuildItem(searchTerm);

        if (!item) {
          return this.ec.channelHelper.watchSend("Couldn't find that item");
        }
        if (newName !== "") {
          item.name = newName;
        }
        if (newPrice !== "") {
          item.price = Number(newPrice);
        }
        if (newUses !== "") {
          item.maxUses = Number(newUses);
        }
        if (newQuantity !== "") {
          const newQuantityNumber = Number(newQuantity);
          item.quantity += newQuantityNumber - item.maxQuantity;
          item.maxQuantity = newQuantityNumber;
        }

        return this.ec.inventoryController.updateGuildItem(item).then(() => {
          return this.ec.channelHelper.watchSend("Item updated").then(() => true);
        });
      default:
        return this.sendHelpMessage();
    }
  }
}
