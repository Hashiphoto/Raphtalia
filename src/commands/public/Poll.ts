import { ApplicationCommandData, CommandInteraction, GuildEmoji } from "discord.js";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { autoInjectable } from "tsyringe";

interface IPollProps extends ICommandProps {
  question: string;
  options: string[];
}

@autoInjectable()
export default class Poll extends Command<IPollProps> {
  public poll: (interaction: CommandInteraction) => void;
  private _maxOptionsAllowed: number;

  public constructor() {
    super();
    this.name = "Poll";
    this.instructions = "Start a poll that users can vote on with reactions";
    this.usage = "`Poll`";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;

    this._maxOptionsAllowed = 5;

    // Generate the command
    const command: ApplicationCommandData = {
      name: RaphtaliaInteraction.Poll,
      description: "Start a poll that users can vote on with reactions",
      options: [
        {
          name: "question",
          description: "What is the question to ask?",
          type: "STRING",
          required: true,
        },
      ],
    };
    for (let i = 1; i <= this._maxOptionsAllowed; i++) {
      command.options?.push({
        name: `option${i}`,
        description: "An option users can vote for",
        type: "STRING",
        required: i < 3, // At least two options required
      });
    }

    this.slashCommands = [command];

    // interaction callbacks
    this.poll = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const question = interaction.options.getString("question", true);
      const options = [];
      for (let i = 1; i <= this._maxOptionsAllowed; i++) {
        const option = interaction.options.getString(`option${i}`);
        if (option) {
          options.push(option);
        }
      }

      this.channel = new InteractionChannel(interaction);

      return this.runWithItem({ initiator, question, options });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    this.reply(`This is only available using the slash command`);
  }

  public async execute({ initiator, question, options }: IPollProps): Promise<number | undefined> {
    const emojis = initiator.guild.emojis.cache.random(options.length);

    const completeOptions: { text: string; emoji: GuildEmoji }[] = [];
    for (let i = 0; i < options.length; i++) {
      completeOptions.push({ text: options[i], emoji: emojis[i] });
    }

    const message = await this.reply(
      `*${initiator.displayName} asks...*\n` +
        `> **${question}**\n\n` +
        completeOptions.map((o) => `${o.emoji} ${o.text}\n`).join("") +
        `_ _`
    );
    if (!message) {
      return;
    }
    for (const option of completeOptions) {
      await message.react(option.emoji);
    }

    return undefined;
  }
}
