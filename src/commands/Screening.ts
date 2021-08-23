import { Guild as DsGuild, GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import GuildService from "../services/Guild.service";
import Question from "../models/Question";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import ScreeningQuestion from "../models/ScreeningQuestion";
import { autoInjectable } from "tsyringe";

enum Action {
  List,
  Add,
  Delete,
}

@autoInjectable()
export default class Screening extends Command {
  public constructor(private _guildService?: GuildService) {
    super();
    this.name = "Screening";
    this.instructions =
      "**Screening**\nView, edit or delete the guild screening questions. " +
      "To view the current screening questions, use the `list` flag. This does not consume an item use.\n" +
      "To add a new screening question, use the `add` flag and answer the additional questions.\n" +
      "To remove a screening question, use the `delete` flag followed by the id of the screening question. The id can be obtained using the `list` flag";
    this.usage = "Usage: `Screening (list | add | delete id)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage();
      return;
    }

    let action: Action;
    let questionId: number | undefined;

    switch (cmdMessage.args[0].toLowerCase()) {
      case "list":
        action = Action.List;
        break;
      case "add":
        action = Action.Add;
        break;
      case "delete": {
        if (cmdMessage.args.length < 2) {
          await this.sendHelpMessage(
            "Please try again and specify the id of the question to delete"
          );
          return;
        }
        questionId = parseInt(cmdMessage.args[1]);
        if (isNaN(questionId)) {
          await this.reply(`Deletion canceled. "${cmdMessage.args[1]}" is not a number`);
          return;
        }
        action = Action.Delete;
        break;
      }
      default:
        await this.sendHelpMessage("Please specify one of: `list`, `add`, `delete`");
        return;
    }

    return this.execute(cmdMessage.message.member, action, questionId);
  }

  public async execute(initiator: GuildMember, action: Action, questionId?: number): Promise<void> {
    switch (action) {
      case Action.List:
        await this.list(initiator.guild);
        break;
      case Action.Add:
        await this.add(initiator);
        break;
      case Action.Delete:
        await this.delete(initiator, questionId);
        break;
    }
  }

  private async list(guild: DsGuild) {
    return this._guildService?.getScreeningQuestions(guild.id).then((questions) => {
      if (questions.length === 0) {
        return this.reply("There are currently no screening questions");
      }
      const allQuestions = questions.reduce((sum, question) => sum + question, "");
      return this.reply(allQuestions);
    });
  }

  private async add(initiator: GuildMember) {
    const screeningQuestion = await this.getNewQuestionDetails(initiator);
    if (!screeningQuestion) {
      return this.reply("Invalid input. Adding new screening question aborted");
    }
    await this._guildService?.addScreeningQuestion(initiator.guild.id, screeningQuestion);
    await this.reply("New question added!");
    await this.useItem(initiator);
  }

  private async delete(initiator: GuildMember, questionId?: number) {
    if (questionId === undefined) {
      return this.sendHelpMessage("Please specify the ID of the question to delete");
    }
    const deleted = await this._guildService?.deleteScreeningQuestion(
      initiator.guild.id,
      questionId
    );
    if (deleted) {
      return this.reply("Question deleted").then(() => this.useItem(initiator));
    }
    return this.reply(`Deletion canceled. There is no question with id ${questionId}`);
  }

  private async getNewQuestionDetails(initiator: GuildMember) {
    const question = new ScreeningQuestion();
    const promptMessage = await this.channelService?.sendTimedMessage(
      this.channel,
      initiator,
      new Question("What is the question they will be asked?", ".*", 120000)
    );
    if (!promptMessage) {
      return;
    }
    question.prompt = promptMessage.content;

    const answerMessage = await this.channelService?.sendTimedMessage(
      this.channel,
      initiator,
      new Question(
        "What is the acceptable answer to the question? (case-insensitive)",
        ".*",
        120000
      )
    );
    if (!answerMessage) {
      return;
    }
    question.answer = "^" + answerMessage.content + "$";

    const timeoutMessage = await this.channelService?.sendTimedMessage(
      this.channel,
      initiator,
      new Question("How many milliseconds (ms) will they have to answer correctly?", ".*", 120000)
    );
    if (!timeoutMessage) {
      return;
    }
    const timeout = parseInt(timeoutMessage.content);
    if (isNaN(timeout)) {
      return;
    }
    question.timeout = timeout;

    const strictMessage = await this.channelService?.sendTimedMessage(
      this.channel,
      initiator,
      new Question(
        "Should the user be ejected immediately after answering incorrectly? (yes/no)",
        "(yes|no)",
        120000
      )
    );
    if (!strictMessage) {
      return;
    }
    question.strict = strictMessage.content.includes("yes");

    return question;
  }
}
