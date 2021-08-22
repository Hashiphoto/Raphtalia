import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Debug extends Command {
  public constructor() {
    super();
    this.instructions = "For testing in development only";
    this.usage = "Usage: `Debug (options)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member);
  }

  public async execute(initiator: GuildMember): Promise<any> {
    // const args = this.ec.messageHelper.args;
    // if (args.length === 0) {
    //   return this.sendHelpMessage();
    // }
    // switch (args[0].toLowerCase()) {
    //   case "resolvecontests":
    //     const feedback = await this.ec.roleContestController
    //       .resolveRoleContests(true)
    //       .then((responses) => responses.reduce(this.sum));
    //     if (feedback.length === 0) {
    //       return;
    //     }
    //     const outputChannel = await this.ec.guildController.getOutputChannel();
    //     if (!outputChannel) {
    //       return;
    //     }
    //     outputChannel.send(feedback);
    //     break;
    //   case "store":
    //     const itemArgs = this.ec.messageHelper.parsedContent
    //       .slice(this.ec.messageHelper.parsedContent.indexOf("store") + 5)
    //       .split(",")
    //       .map((arg) => arg.trim());
    //     if (itemArgs.length < 5) {
    //       return this.reply("Please provide all 5 arguments (search, name, price, uses, quantity)");
    //     }
    //     const [searchTerm, newName, newPrice, newUses, newQuantity] = itemArgs;
    //     const item = await this._inventoryService.findGuildItem(searchTerm);
    //     if (!item) {
    //       return this.reply("Couldn't find that item");
    //     }
    //     if (newName !== "") {
    //       item.name = newName;
    //     }
    //     if (newPrice !== "") {
    //       item.price = Number(newPrice);
    //     }
    //     if (newUses !== "") {
    //       item.maxUses = Number(newUses);
    //     }
    //     if (newQuantity !== "") {
    //       const newQuantityNumber = Number(newQuantity);
    //       item.quantity += newQuantityNumber - item.maxQuantity;
    //       item.maxQuantity = newQuantityNumber;
    //     }
    //     return this._inventoryService.updateGuildItem(item).then(() => {
    //       return this.reply("Item updated").then(() => true);
    //     });
    //   default:
    //     return this.sendHelpMessage();
    // }
  }
}
