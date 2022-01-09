import { CommandInteraction, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { IArgProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import CommandService from "../../services/Command.service";
import Command from "../Command";

enum Args {
  COMMAND_NAME,
}

@autoInjectable()
export default class Help extends Command<IArgProps> {
  public help: (interaction: CommandInteraction) => void;

  public constructor(
    @inject(delay(() => CommandService)) private _commandService?: CommandService
  ) {
    super();
    this.name = "Help";
    this.instructions = "Get detailed information about how to use any other command";
    this.usage = "`Help (command name)`";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Help,
        description: "Receive detailed help about another command",
        options: [
          {
            name: "command",
            description: "The name of the command",
            type: "STRING",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.help = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const commandName = interaction.options.getString("command", true);

      this.channel = new InteractionChannel(interaction, true);
      this.runWithItem({ initiator, arg: commandName }).catch(() =>
        interaction.reply({ content: "Something went wrong", ephemeral: true })
      );
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage(this.instructions);
      return;
    }
    await this.runWithItem({
      initiator: cmdMessage.message.member,
      arg: cmdMessage.args[Args.COMMAND_NAME],
    });
  }

  public async execute({ arg: commandName }: IArgProps): Promise<number | undefined> {
    const command = this._commandService?.getCommandByName(
      commandName.toLowerCase().replace(/[!-_\s]/g, "")
    );

    if (!command) {
      await this.sendHelpMessage();
      return;
    }
    command.channel = this.channel;
    await command.sendHelpMessage(command.instructions);
    return 1;
  }
}
