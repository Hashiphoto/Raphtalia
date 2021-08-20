import { Message } from "discord.js";
import { inject, injectable } from "tsyringe";
import AllowWord from "../commands/AllowWord";
import AutoDelete from "../commands/AutoDelete";
import Balance from "../commands/Balance";
import BanList from "../commands/BanList";
import BanWord from "../commands/BanWord";
import Buy from "../commands/Buy";
import Censorship from "../commands/Censorship";
import Command from "../commands/Command";
import Debug from "../commands/Debug";
import Exile from "../commands/Exile";
import Give from "../commands/Give";
import Headpat from "../commands/Headpat";
import Help from "../commands/Help";
import HoldVote from "../commands/HoldVote";
import Infractions from "../commands/Infractions";
import NullCommand from "../commands/NullCommand";
import Pardon from "../commands/Pardon";
import Play from "../commands/Play";
import Promote from "../commands/Promote";
import Register from "../commands/Register";
import Roles from "../commands/Roles";
import Scan from "../commands/Scan";
import Screening from "../commands/Screening";
import ServerStatus from "../commands/ServerStatus";
import Status from "../commands/Status";
import Steal from "../commands/Steal";
import Store from "../commands/Store";
import Take from "../commands/Take";
import { Env } from "../enums/Environment";
import CommmandMessageWrapper from "../models/dsExtensions/CommandMessage";
import InventoryService from "./Inventory.service";
import RoleService from "./Role.service";

@injectable()
export default class CommandService {
  public constructor(
    @inject(RoleService) private _roleService: RoleService,
    @inject(InventoryService) private _inventoryService: InventoryService
  ) {}

  public async processMessage(message: Message): Promise<void> {
    const cmdMessage = new CommmandMessageWrapper(message);
    const command = await this.selectCommand(cmdMessage);
    await this.executeCommand(cmdMessage, command);
  }

  private async selectCommand(cmdMessage: CommmandMessageWrapper): Promise<Command> {
    // Check for exile
    if (!cmdMessage.message.guild || !cmdMessage.message.member) {
      return new NullCommand("Commands can only be used in a server text channel");
    }
    const exileRole = await this._roleService.getCreateExileRole(cmdMessage.message.guild);
    if (cmdMessage.message.member?.roles.cache.find((r) => r.id === exileRole.id)) {
      return new NullCommand(`You cannot use commands while in exile`);
    }

    // Get the command
    const command = this.getCommandByName(cmdMessage.command);
    if (!command) {
      return new NullCommand(`Unknown command "${cmdMessage.command}"`);
    }
    if (command instanceof NullCommand) {
      return command;
    }

    // Check if member has the correct item
    const userItem = await this._inventoryService.getUserItemByCommand(
      cmdMessage.message.member,
      command.name
    );
    if (userItem) {
      command.item = userItem;
      return command;
    }

    return command;
    // return this.autoBuyNeededItem(context, command);
  }

  /**
   * Buy the item rquired to execute the given command, and return the command with that
   * item attached
   */
  // private async autoBuyNeededItem(command: Command): Promise<Command> {
  //   const guildItem = await context.inventoryController.getGuildItemByCommand(
  //     context.guild.id,
  //     command.name
  //   );
  //   if (!guildItem) {
  //     return new NullCommand(
  //       context,
  //       `There is no item associated with the command "${command.name}"`
  //     );
  //   }

  //   let purchasedUserItem: UserItem | undefined;
  //   try {
  //     purchasedUserItem = await context.inventoryController.userPurchase(
  //       guildItem,
  //       context.initiator
  //     );
  //   } catch (error) {
  //     let resultMessage = `An error occurred purchasing the ${guildItem.printName()} automatically`;
  //     switch (error.result) {
  //       case Result.OutOfStock:
  //         resultMessage = `Could not auto-purchase ${guildItem.printName()} because it is currently out of stock`;
  //         break;
  //       case Result.TooPoor:
  //         resultMessage = `Could not auto-purchase ${guildItem.printName()} because you're too poor. Current price: ${guildItem.printPrice()}`;
  //         break;
  //     }
  //     return new NullCommand(context, resultMessage);
  //   }

  //   if (!purchasedUserItem) {
  //     return new NullCommand(
  //       context,
  //       `Auto-purchasing this item failed. Please try "!Buy ${guildItem.name}"`
  //     );
  //   }

  //   await context.channelHelper.watchSend(
  //     `*${
  //       context.initiator.displayName
  //     } Auto-purchased a ${guildItem.printName()} for ${guildItem.printPrice()}*`
  //   );

  //   command.item = purchasedUserItem;
  //   return command;
  // }

  private async executeCommand(cmdMessage: CommmandMessageWrapper, command: Command) {
    cmdMessage.message.channel.startTyping();
    return command
      .executeDefault(cmdMessage)
      .catch((error) => {
        console.error(error);
        return cmdMessage.message.react("🛑");
      })
      .finally(() => {
        cmdMessage.message.channel.stopTyping(true);
      });
  }

  public getCommandByName(name: string): Command | undefined {
    // Keep alphabetical by primary command word
    // The primary command keyword should be listed first
    switch (name) {
      case "allowword":
      case "allowwords":
        return new AllowWord();
      case "autodelete":
        return new AutoDelete();
      case "balance":
      case "wallet":
        return new Balance();
      case "banlist":
      case "bannedwords":
        return new BanList();
      case "banword":
      case "banwords":
        return new BanWord();
      case "buy":
        return new Buy();
      case "censorship":
        return new Censorship();
      case "exile":
        return new Exile();
      case "give":
        return new Give();
      case "headpat":
        return new Headpat();
      case "help":
        return new Help();
      case "holdvote":
        return new HoldVote();
      case "infractions":
        return new Infractions();
      case "pardon":
        return new Pardon();
      case "play":
        return new Play();
      case "promote":
        return new Promote();
      case "register":
        return new Register();
      case "roles":
        return new Roles();
      case "scan":
        return new Scan();
      case "screening":
        return new Screening();
      case "serverstatus":
        return new ServerStatus();
      case "status":
        return new Status();
      case "steal":
        return new Steal();
      case "store":
        return new Store();
      case "take":
        return new Take();
      case "debug":
        if (process.env.NODE_ENV === Env.Dev) {
          return new Debug();
        }
    }
  }
}
