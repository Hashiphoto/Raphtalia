import AllowWord from "../routes/commands/AllowWord";
import AutoDelete from "../routes/commands/AutoDelete";
import Balance from "../routes/commands/Balance";
import BanList from "../routes/commands/BanList";
import BanWord from "../routes/commands/BanWord";
import Buy from "../routes/commands/Buy";
import Censorship from "../routes/commands/Censorship";
import Command from "../routes/commands/Command";
import Debug from "../routes/commands/Debug";
import DeliverCheck from "../routes/commands/DeliverCheck";
import Demote from "../routes/commands/zDemote";
import ExecutionContext from "../models/ExecutionContext";
import Exile from "../routes/commands/Exile";
import Fine from "../routes/commands/zFine";
import Give from "../routes/commands/Give";
import Headpat from "../routes/commands/Headpat";
import Help from "../routes/commands/Help";
import HoldVote from "../routes/commands/HoldVote";
import Infractions from "../routes/commands/Infractions";
import Kick from "../routes/commands/zKick";
import { Message } from "discord.js";
import NullCommand from "../routes/commands/NullCommand";
import Pardon from "../routes/commands/Pardon";
import Play from "../routes/commands/Play";
import Promote from "../routes/commands/Promote";
import Raphtalia from "../Raphtalia";
import Register from "../routes/commands/Register";
import Report from "../routes/commands/Report";
import { Result } from "../enums/Result";
import Roles from "../routes/commands/Roles";
import Scan from "../routes/commands/Scan";
import Screening from "../routes/commands/Screening";
import ServerStatus from "../routes/commands/ServerStatus";
import SoftKick from "../routes/commands/zSoftKick";
import Status from "../routes/commands/Status";
import Steal from "../routes/commands/Steal";
import Store from "../routes/commands/Store";
import Take from "../routes/commands/Take";
import UserItem from "../models/UserItem";
import { injectable } from "tsyringe";

@injectable()
export default class CommandService {
  public constructor() {}

  public async processMessage(message: Message): Promise<void> {}

  private async selectCommand(context: ExecutionContext): Promise<Command> {
    // Check for exile
    const exileRole = context.guild.roles.cache.find((r) => r.name === "Exile");
    if (exileRole && context.message.member?.roles.cache.find((r) => r.id === exileRole.id)) {
      return Promise.resolve(new NullCommand(context, `You cannot use commands while in exile`));
    }

    // Get the command
    let command = Raphtalia.getCommandByName(context, context.messageHelper.command);
    if (!command) {
      command = new NullCommand(context, `Unknown command "${context.messageHelper.command}"`);
    }
    if (command instanceof NullCommand) {
      return command;
    }

    // Check if member has the correct item
    const userItem = await context.inventoryController.getUserItemByCommand(
      context.initiator,
      command.name
    );
    if (userItem) {
      command.item = userItem;
      return command;
    }

    return this.autoBuyNeededItem(context, command);
  }

  /**
   * Buy the item rquired to execute the given command, and return the command with that
   * item attached
   */
  private async autoBuyNeededItem(context: ExecutionContext, command: Command): Promise<Command> {
    const guildItem = await context.inventoryController.getGuildItemByCommand(
      context.guild.id,
      command.name
    );
    if (!guildItem) {
      return new NullCommand(
        context,
        `There is no item associated with the command "${command.name}"`
      );
    }

    let purchasedUserItem: UserItem | undefined;
    try {
      purchasedUserItem = await context.inventoryController.userPurchase(
        guildItem,
        context.initiator
      );
    } catch (error) {
      let resultMessage = `An error occurred purchasing the ${guildItem.printName()} automatically`;
      switch (error.result) {
        case Result.OutOfStock:
          resultMessage = `Could not auto-purchase ${guildItem.printName()} because it is currently out of stock`;
          break;
        case Result.TooPoor:
          resultMessage = `Could not auto-purchase ${guildItem.printName()} because you're too poor. Current price: ${guildItem.printPrice()}`;
          break;
      }
      return new NullCommand(context, resultMessage);
    }

    if (!purchasedUserItem) {
      return new NullCommand(
        context,
        `Auto-purchasing this item failed. Please try "!Buy ${guildItem.name}"`
      );
    }

    await context.channelHelper.watchSend(
      `*${
        context.initiator.displayName
      } Auto-purchased a ${guildItem.printName()} for ${guildItem.printPrice()}*`
    );

    command.item = purchasedUserItem;
    return command;
  }

  private async executeCommand(context: ExecutionContext, command: Command) {
    context.message.channel.startTyping();
    return command
      .execute()
      .catch((error) => {
        console.error(error);
        return context.message.react("🛑");
      })
      .finally(() => {
        context.message.channel.stopTyping(true);
      });
  }

  static getCommandByName(context: ExecutionContext, name: string): Command {
    // Keep alphabetical by primary command word
    // The primary command keyword should be listed first
    switch (name) {
      case "allowword":
      case "allowwords":
        return new AllowWord(context);
      case "autodelete":
        return new AutoDelete(context);
      case "balance":
      case "wallet":
        return new Balance(context);
      case "banlist":
      case "bannedwords":
        return new BanList(context);
      case "banword":
      case "banwords":
        return new BanWord(context);
      case "buy":
        return new Buy(context);
      case "censorship":
        return new Censorship(context);
      case "delivercheck":
        return new DeliverCheck(context);
      case "demote":
        return new Demote(context);
      case "exile":
        return new Exile(context);
      case "fine":
        return new Fine(context);
      case "give":
        return new Give(context);
      case "headpat":
        return new Headpat(context);
      case "help":
        return new Help(context);
      case "holdvote":
        return new HoldVote(context);
      case "infractions":
        return new Infractions(context);
      case "kick":
        return new Kick(context);
      case "pardon":
        return new Pardon(context);
      case "play":
        return new Play(context);
      case "promote":
        return new Promote(context);
      case "register":
        return new Register(context);
      case "report":
        return new Report(context);
      case "roles":
        return new Roles(context);
      case "scan":
        return new Scan(context);
      case "screening":
        return new Screening(context);
      case "serverstatus":
        return new ServerStatus(context);
      case "softkick":
        return new SoftKick(context);
      case "status":
        return new Status(context);
      case "steal":
        return new Steal(context);
      case "store":
        return new Store(context);
      case "take":
        return new Take(context);
      case "debug":
        if (process.env.NODE_ENV === "dev") {
          return new Debug(context);
        }
        return new NullCommand(context, `Unknown command "${name}"`);
      default:
        return new NullCommand(context, `Unknown command "${name}"`);
    }
  }
}
