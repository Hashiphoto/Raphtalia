import { CommandInteraction, MessageEmbed, TextChannel } from "discord.js";
import { Format, print } from "../../utilities/Util";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import GuildItem from "../../models/GuildItem";
import { IArgProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import InventoryService from "../../services/Inventory.service";
import { Purchase } from "../../models/Purchase";
import RaphError from "../../models/RaphError";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";

interface IBuyProps extends IArgProps {
  quantity?: number;
}

@autoInjectable()
export default class Buy extends Command<IBuyProps> {
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
          {
            name: "quantity",
            description: "Number of items to purchase",
            type: "NUMBER",
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
      const quantity = interaction.options.getNumber("quantity") ?? undefined;
      console.log(quantity);
      return this.runWithItem({ initiator, arg: itemName, quantity });
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

  public async execute({
    initiator,
    arg: itemName,
    quantity,
  }: IBuyProps): Promise<number | undefined> {
    if (!this._inventoryService) {
      throw new RaphError(Result.ProgrammingError);
    }
    // Get the guild item they are buying
    let guildItem: GuildItem | undefined;
    try {
      guildItem = await this._inventoryService.findGuildItem(initiator.guild.id, itemName);
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

    let purchase: Purchase;
    try {
      purchase = await this._inventoryService.userPurchase(initiator, guildItem, quantity);
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

    this.reply(`Thank you for your purchase! ${guildItem.printName()}`, {
      embeds: [
        new MessageEmbed().setColor(0x86ff6b).addFields({
          name: print(purchase.cost, Format.Dollar),
          value: [
            `Quantity: ${purchase.items.length}`,
            `Uses: ${purchase.items[0].printMaxUses()} per item`,
          ].join("\n"),
        }),
      ],
    });
    return undefined;
  }
}
