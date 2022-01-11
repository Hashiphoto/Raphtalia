import { CommandInteraction, Guild as DsGuild, GuildMember } from "discord.js";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import GuildService from "../../services/Guild.service";
import { ICommandProps } from "../../interfaces/CommandInterfaces";
import InteractionChannel from "../../models/InteractionChannel";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import ScreeningQuestion from "../../models/ScreeningQuestion";
import { autoInjectable } from "tsyringe";

enum Action {
  List = "list",
  Add = "add",
  Delete = "delete",
}

interface IScreeningProps extends ICommandProps {
  action: Action;
  questionId?: number;
  newQuestion?: ScreeningQuestion;
}

@autoInjectable()
export default class Screening extends Command<IScreeningProps> {
  public screening: (interaction: CommandInteraction) => void;

  public constructor(private _guildService?: GuildService) {
    super();
    this.name = "Screening";
    this.instructions =
      "View or change the server screening questions. Leader only\n" +
      "`list` shows all the current screening questions\n" +
      "`add` creates additional questions\n" +
      "`delete` removes a question. The id can be found by using `list`";
    this.usage = "`Screening (list | add | delete id)`";
    this.aliases = [this.name.toLowerCase()];
    this.itemRequired = false;
    this.leaderOnly = true;
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Screening,
        description: "Edit the server screening questions new members are asked on entry",
        options: [
          {
            name: "list",
            description: "View current screening questions",
            type: "SUB_COMMAND",
          },
          {
            name: "add",
            description: "Add a new question",
            type: "SUB_COMMAND",
            options: [
              {
                name: "question",
                description: "What is the question the user will be asked?",
                type: "STRING",
                required: true,
              },
              {
                name: "answer",
                description: "What is the answer to the question?",
                type: "STRING",
                required: true,
              },
              {
                name: "time",
                description: "How many seconds does the user have to answer before being ejected?",
                type: "INTEGER",
                required: true,
              },
              {
                name: "strict",
                description:
                  "If strict is true, the user only has one attempt to answer before being ejected",
                type: "BOOLEAN",
                required: true,
              },
            ],
          },
          {
            name: "delete",
            description: "Delete an existing question",
            type: "SUB_COMMAND",
            options: [
              {
                name: "id",
                description: "The id of the question to delete",
                type: "INTEGER",
                required: true,
              },
            ],
          },
        ],
      },
    ];

    // interaction callbacks
    this.screening = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild || !interaction.guild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }

      const action = interaction.options.getSubcommand(true) as Action;
      const props: IScreeningProps = { initiator, action };
      if (action === Action.Add) {
        props.newQuestion = new ScreeningQuestion(
          undefined,
          interaction.options.getString("question", true),
          interaction.options.getString("answer", true),
          interaction.options.getInteger("time", true) * 1000, // cast to ms
          interaction.options.getBoolean("strict", true)
        );
      } else if (action === Action.Delete) {
        props.questionId = interaction.options.getInteger("id", true);
      }

      this.channel = new InteractionChannel(interaction);
      this.runWithItem(props);
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    await this.reply(
      `Use the slash command. This is only available to the user(s) holding the highest role`
    );
    return;
  }

  public async execute({
    initiator,
    action,
    questionId,
    newQuestion,
  }: IScreeningProps): Promise<number | undefined> {
    switch (action) {
      case Action.List:
        return this.list(initiator.guild);
      case Action.Add:
        return this.add(initiator, newQuestion);
      case Action.Delete:
        return this.delete(initiator, questionId);
      default:
        await this.reply(`Unknown action ${action}`);
    }
  }

  private async list(guild: DsGuild): Promise<undefined> {
    return this._guildService
      ?.getScreeningQuestions(guild.id)
      .then((questions) => {
        if (questions.length === 0) {
          return this.reply("There are currently no screening questions");
        }
        const allQuestions = questions.reduce((sum, question) => sum + question, "");
        return this.reply(allQuestions);
      })
      .then(() => undefined);
  }

  private async add(
    initiator: GuildMember,
    screeningQuestion: ScreeningQuestion | undefined
  ): Promise<number | undefined> {
    if (!screeningQuestion) {
      await this.reply("All required fields must be filled out");
      return;
    }
    await this._guildService?.addScreeningQuestion(initiator.guild.id, screeningQuestion);
    await this.reply("New question added!");
    return 1;
  }

  private async delete(initiator: GuildMember, questionId?: number): Promise<number | undefined> {
    if (questionId === undefined) {
      return this.sendHelpMessage("Please specify the ID of the question to delete");
    }
    const deleted = await this._guildService?.deleteScreeningQuestion(
      initiator.guild.id,
      questionId
    );
    if (!deleted) {
      await this.reply(`Deletion canceled. There is no question with id ${questionId}`);
      return;
    }
    await this.reply("Question deleted");
    return 1;
  }
}
