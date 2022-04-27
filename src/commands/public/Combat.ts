import { CommandInteraction, GuildMember } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import FighterService from "../../services/Fighter.service";
import Command from "../Command";

@autoInjectable()
export default class Combat extends Command<ICommandProps> {
  public combat: (interaction: CommandInteraction) => void;

  public constructor(
    @inject(delay(() => FighterService)) private _fighterService?: FighterService
  ) {
    super();
    this.name = "Combat";
    this.instructions = "View and update your combat attributes";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Combat,
        description: "View your combat stats",
      },
    ];

    // interaction callbacks
    this.combat = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      this.channel = new InteractionChannel(interaction, true);
      return this.runWithItem({ initiator });
    };
  }

  public async runFromCommand(): Promise<void> {
    this.queueReply("Use the slash command `/combat` instead");
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    const { content } = await this.generateMessage(initiator);
    this.reply(content);
    // const { content, embed } = await this.generateMessage(initiator);
    // this.reply(content, { embeds: [embed] });
    return undefined;
  }

  private async generateMessage(initiator: GuildMember) {
    if (!this._fighterService) {
      throw new RaphError(Result.ProgrammingError, "fighter service is null");
    }
    const fighter = await this._fighterService.getByUser(initiator);

    return { content: fighter.toString() };
  }
}
