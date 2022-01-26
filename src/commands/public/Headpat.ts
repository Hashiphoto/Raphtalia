import { CommandInteraction, TextChannel } from "discord.js";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { ITargettedProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Headpat extends Command<ITargettedProps> {
  public headpat: (interaction: CommandInteraction) => void;

  public constructor() {
    super();
    this.name = "Headpat";
    this.instructions = "I will give a headpat to the member(s) is specified";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Headpat,
        description: "I'll pat someone on the head for you",
        options: [
          {
            name: "user",
            description: "The user needing a headpat",
            type: "USER",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.headpat = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const user = interaction.options.getUser("user", true);
      const target = await interaction.guild.members.fetch(user.id);

      this.channel = new InteractionChannel(interaction);
      return this.runWithItem({ initiator, targets: [target] });
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

  public async execute({ targets }: ITargettedProps): Promise<number | undefined> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    let response = "";
    for (const member of targets) {
      response += `${member.toString()} headpat\n`;
    }

    this.queueReply(response);
    return undefined;
  }
}
