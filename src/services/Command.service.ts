import { Message, TextChannel } from "discord.js";
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
import Poke from "../commands/Poke";
import Promote from "../commands/Promote";
import Register from "../commands/Register";
import Revolt from "../commands/Revolt";
import Roles from "../commands/Roles";
import Scan from "../commands/Scan";
import Screening from "../commands/Screening";
import ServerStatus from "../commands/ServerStatus";
import Status from "../commands/Status";
import Steal from "../commands/Steal";
import Store from "../commands/Store";
import Take from "../commands/Take";
import CommmandMessageWrapper from "../models/CommandMessage";
import ChannelService from "./Channel.service";
import InventoryService from "./Inventory.service";
import RoleService from "./Role.service";

@injectable()
export default class CommandService {
  public static All: Command[] = [
    new AllowWord(),
    new AutoDelete(),
    new Balance(),
    new BanList(),
    new BanWord(),
    new Buy(),
    new Censorship(),
    new Debug(),
    new Exile(),
    new Give(),
    new Headpat(),
    new Help(),
    new HoldVote(),
    new Infractions(),
    new Pardon(),
    new Play(),
    new Poke(),
    new Promote(),
    new Register(),
    new Revolt(),
    new Roles(),
    new Scan(),
    new Screening(),
    new ServerStatus(),
    new Status(),
    new Steal(),
    new Store(),
    new Take(),
  ];

  public constructor(
    @inject(RoleService) private _roleService: RoleService,
    @inject(InventoryService) private _inventoryService: InventoryService,
    @inject(ChannelService) private _channelService: ChannelService
  ) {}

  public async processMessage(message: Message): Promise<void> {
    const cmdMessage = new CommmandMessageWrapper(message);
    const command = await this.selectCommand(cmdMessage);
    console.log(message.author.username, message.author.id, command.name, cmdMessage.args);
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
    const command =
      this.getCommandByName(cmdMessage.command) ??
      new NullCommand(`Unknown command "${cmdMessage.command}"`);
    if (command instanceof NullCommand) {
      return command;
    }

    // Check if member has the correct item
    const userItem = await this._inventoryService.getUserItemByCommand(
      cmdMessage.message.member,
      command.name
    );
    if (!userItem) {
      return new NullCommand(
        `${cmdMessage.message.member.displayName} doesn't have the correct item to use the **${cmdMessage.command}** command`
      );
    }

    command.item = userItem;
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
    cmdMessage.message.channel.sendTyping();
    try {
      await command.executeDefault(cmdMessage);
    } catch (error) {
      console.error(error);
      cmdMessage.message.channel.isText() &&
        (await this._channelService.watchSend(
          cmdMessage.message.channel as TextChannel,
          error.message
        ));
      return cmdMessage.message.react("🛑");
    }
  }

  public getCommandByName(name: string): Command | undefined {
    return CommandService.All.find((command) => command.aliases.includes(name.toLowerCase()));
  }
}
