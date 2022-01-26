import { CommandInteraction, TextChannel } from "discord.js";
import { Format, print } from "../../utilities/Util";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import GuildItem from "../../models/GuildItem";
import { IArgProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import InventoryService from "../../services/Inventory.service";
import RaphError from "../../models/RaphError";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Buy extends Command<IArgProps> {
  public buy: (interaction: CommandInteraction) => void;

  public constructor(private _inventoryService?: InventoryService) {
    super();
    this.name = "Buy";
    this.instructions =
      "Purchase an item from the server store. The item will be added to your inventory, if there is adequate quantity in the store";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Buy,
        description: "Purchase an item from the store",
        options: [
          {
            name: "item",
            description:
              "The name of the item to purchase. You do not need to enter the whole name",
            type: "STRING",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.buy = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }

      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      this.channel = new InteractionChannel(interaction);
      const itemName = interaction.options.getString("item", true);
      return this.runWithItem({ initiator, arg: itemName });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({
      initiator: cmdMessage.message.member,
      arg: cmdMessage.parsedContent,
    });
  }

  public async execute({ initiator, arg: itemName }: IArgProps): Promise<number | undefined> {
    // Get the guild item they are buying
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this._inventoryService?.findGuildItem(initiator.guild.id, itemName);
    } catch (error) {
      if (error.result === Result.AmbiguousInput) {
        this.queueReply(`There is more than one item with that name. Matches: ${error.message}`);
        return;
      }
      throw error;
    }
    if (!guildItem) {
      this.queueReply(`There are no items named "${itemName}"`);
      return;
    }

    try {
      await this._inventoryService?.userPurchase(initiator, guildItem);
    } catch (error) {
      switch (error.result) {
        case Result.OutOfStock:
          this.queueReply(`${guildItem.printName()} is currently out of stock`);
          return;
        case Result.TooPoor:
          this.queueReply(
            `You do not have enough money to buy ${guildItem.printName()}. Current price: ${guildItem.printPrice()}`
          );
          return;
        default:
          console.error(error);
          this.queueReply(`An error occurred purchasing the ${guildItem.printName()}`);
          return;
      }
    }

    this.queueReply(
      `Thank you for your purchase of ${print(
        guildItem.price,
        Format.Dollar
      )}!\n>>> ${guildItem.printName()} | Uses: ${guildItem.printMaxUses()}`
    );
    return undefined;
  }
}
