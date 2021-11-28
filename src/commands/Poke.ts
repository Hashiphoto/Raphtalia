import {
  CommandInteraction,
  User as DsUser,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  TextChannel,
} from "discord.js";

import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { ITargettedProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { RaphtaliaInteraction } from "../enums/Interactions";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import { buildCustomId } from "../utilities/Util";

@autoInjectable()
export default class Poke extends Command<ITargettedProps> {
  public poke: (interaction: CommandInteraction) => void;
  public pokeBack: (interaction: MessageComponentInteraction, args: string[]) => void;

  public constructor() {
    super();
    this.name = "Poke";
    this.instructions = "I will poke the targeted member for you";
    this.usage = "`Poke @member`";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Poke,
        description: "Poke one of your friends in a completely not annoying way!",
        options: [
          {
            name: "user",
            description: "The user to poke",
            type: "USER",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.poke = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const targetUser = interaction.options.getUser("user");
      const target = targetUser ? await interaction.guild?.members.fetch(targetUser) : undefined;
      if (!target) {
        return interaction.reply(
          `I don't know who to poke. No user was specified or they are not members of the server`
        );
      }
      this.runWithItem({ initiator, targets: [target] }).then(() => {
        return interaction.reply({ content: `Poked ${target.toString()}!`, ephemeral: true });
      });
    };

    this.pokeBack = async (
      interaction: MessageComponentInteraction,
      args: string[]
    ): Promise<void> => {
      interaction.update({ components: [] });
      if (!args.length) {
        interaction.followUp(`Ah, I don't know who to poke. Sorry`);
        return;
      }
      const target = await this.clientService?.getClient().users.fetch(args[0]);
      if (!target) {
        interaction.followUp(
          `Hm, I couldn't contact that user. Maybe they aren't in any guilds that I'm in`
        );
        return;
      }
      this.sendPoke(target, interaction.user).then(() => interaction.followUp("Poke sent!"));
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({
      initiator: cmdMessage.message.member,
      targets: cmdMessage.memberMentions,
    });
  }

  public async execute({ initiator, targets }: ITargettedProps): Promise<number | undefined> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      await this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    let successes = 0;

    await Promise.all(
      targets.map((target) =>
        this.sendPoke(target.user, initiator.user)
          .then(() => successes++)
          .catch(() => {
            // swallow
          })
      )
    );

    await this.reply(`Sent ${successes} poke${successes > 1 ? "s" : ""}!`);
    return targets.length;
  }

  private async sendPoke(target: DsUser, initiator: DsUser): Promise<Message> {
    return target.createDM().then((dmChannel) => {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Poke Back")
          .setStyle(1)
          .setCustomId(buildCustomId(RaphtaliaInteraction.ButtonPokeBack, initiator.id))
      );
      return dmChannel.send({
        content: `${initiator.toString()} poked you!`,
        components: [row],
      });
    });
  }
}
