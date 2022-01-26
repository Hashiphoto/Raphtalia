import { CommandInteraction, TextChannel } from "discord.js";

import BanListService from "../../services/message/BanWordList.service";
import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import GuildService from "../../services/Guild.service";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";

enum Args {
  ACTION,
}

interface ICensorshipProps extends ICommandProps {
  isEnabled: boolean;
}

@autoInjectable()
export default class Censorship extends Command<ICensorshipProps> {
  public censorship: (interaction: CommandInteraction) => void;

  public constructor(
    private _guildService?: GuildService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "Censorship";
    this.instructions =
      "Enable or disable censorship for the whole server. " +
      "When censorship is enabled, anyone who uses a word from the banned " +
      "list will be given an infraction";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.leaderOnly = true;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Censorship,
        description: "Enable or disable censorship for the whole server",
        defaultPermission: false,
        options: [
          {
            name: "enabled",
            description: "Set to True to enable censorship",
            type: "BOOLEAN",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.censorship = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const isEnabled = interaction.options.getBoolean("enabled", true);
      this.channel = new InteractionChannel(interaction);
      this.runWithItem({ initiator, isEnabled });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    const args = cmdMessage.args;
    if (args.length === 0) {
      return this.sendHelpMessage();
    }

    let isEnabled: boolean;

    if (args[Args.ACTION].startsWith("enable")) {
      isEnabled = true;
    } else if (args[Args.ACTION].startsWith("disable")) {
      isEnabled = false;
    } else {
      return this.sendHelpMessage("Please specify either `start` or `stop`");
    }
    await this.runWithItem({ initiator: cmdMessage.message.member, isEnabled });
  }

  public async execute({ initiator, isEnabled }: ICensorshipProps): Promise<number | undefined> {
    if (isEnabled) {
      this.queueReply("Censorship is enabled");
    } else {
      this.queueReply("All speech is permitted!");
    }

    await this._guildService?.setCensorship(initiator.guild.id, isEnabled);
    this._banListService?.update(initiator.guild);

    return undefined;
  }
}
