import { CommandInteraction, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import RaphError from "../../models/RaphError";
import MemberService from "../../services/Member.service";
import Command from "../Command";

@autoInjectable()
export default class Promote extends Command<ICommandProps> {
  public promote: (interaction: CommandInteraction) => void;

  public constructor(@inject(delay(() => MemberService)) private MemberService?: MemberService) {
    super();
    this.name = "Promote";
    this.instructions = "Increase your rank by one";
    this.usage = "`Promote`";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Promote,
        description: "Increase your server rank",
      },
    ];

    // interaction callbacks
    this.promote = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }

      if (interaction.channel) {
        this.channel = interaction.channel;
      }

      this.runWithItem({ initiator }).then(() => {
        interaction.reply({ content: "Promotion request received", ephemeral: true });
      });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    if (!this.channel || !((this.channel as TextChannel)?.type === "GUILD_TEXT")) {
      throw new RaphError(Result.ProgrammingError, "This command needs a channel");
    }
    try {
      const feedback = await this.MemberService?.promoteMember(
        initiator,
        this.channel as TextChannel
      );
      if (feedback?.length) {
        this.reply(feedback);
      }
    } catch (error) {
      if (error.name === "RaphError") {
        await this.reply(error.message);
        return;
      }
      throw error;
    }

    return 1;
  }
}
