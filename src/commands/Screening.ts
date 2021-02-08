import BadParametersError from "../structures/errors/BadParametersError";
import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import Question from "../structures/Question";
import ScreeningQuestion from "../structures/ScreeningQuestion";
import watchSendTimedMessage from "../timedMessage";

export default class Screening extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**Screening**\nView, edit or delete the guild screening questions. " +
      "To view the current screening questions, use the `list` flag. This does not consume an item use.\n" +
      "To add a new screening question, use the `add` flag and answer the additional questions.\n" +
      "To remove a screening question, use the `delete` flag followed by the id of the screening question. The id can be obtained using the `list` flag";
    this.usage = "Usage: `Screening (list | add | delete id)`";
  }

  public async execute(): Promise<any> {
    if (this.ec.messageHelper.args.length === 0) {
      return this.sendHelpMessage();
    }

    switch (this.ec.messageHelper.args[0].toLowerCase()) {
      case "list":
        return await this.list();
      case "add":
        return await this.add();
      case "delete":
        if (this.ec.messageHelper.args.length < 2) {
          return this.sendHelpMessage(
            "Please try again and specify the id of the question to delete"
          );
        }
        return this.delete();
      default:
        return this.sendHelpMessage("Please specify one of: `list`, `add`, `delete`");
    }
  }

  private async list() {
    return this.ec.guildController.getScreeningQuestions().then((questions) => {
      if (questions.length === 0) {
        return this.ec.channelHelper.watchSend("There are currently no screening questions");
      }
      const allQuestions = questions.reduce((sum, question) => sum + question, "");
      return this.ec.channelHelper.watchSend(allQuestions);
    });
  }

  private async add() {
    const screeningQuestion = await this.getNewQuestionDetails();
    if (!screeningQuestion) {
      return this.ec.channelHelper.watchSend(
        "Invalid input. Adding new screening question aborted"
      );
    }
    return this.ec.guildController
      .addScreeningQuestion(screeningQuestion)
      .then(() => this.ec.channelHelper.watchSend("New question added!"))
      .then(() => this.useItem())
      .catch((error) => {
        if (error instanceof BadParametersError) {
          return this.ec.channelHelper.watchSend(
            "Invalid input. Adding new screening question aborted"
          );
        }
        throw error;
      });
  }

  private async delete() {
    const id = parseInt(this.ec.messageHelper.args[1]);
    if (isNaN(id)) {
      return this.ec.channelHelper.watchSend(
        `Deletion canceled. "${this.ec.messageHelper.args[1]}" is not a number`
      );
    }
    return this.ec.guildController.deleteScreeningQuestion(id).then(async (deleted) => {
      if (deleted) {
        return this.ec.channelHelper.watchSend("Question deleted").then(() => this.useItem());
      }
      return this.ec.channelHelper.watchSend(
        `Deletion canceled. There is no question with id ${id}`
      );
    });
  }

  private async getNewQuestionDetails() {
    let question = new ScreeningQuestion();
    const promptMessage = await watchSendTimedMessage(
      this.ec,
      this.ec.initiator,
      new Question("What is the question they will be asked?", ".*", 120000)
    );
    if (!promptMessage) {
      return;
    }
    question.prompt = promptMessage.content;

    const answerMessage = await watchSendTimedMessage(
      this.ec,
      this.ec.initiator,
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

    const timeoutMessage = await watchSendTimedMessage(
      this.ec,
      this.ec.initiator,
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

    const strictMessage = await watchSendTimedMessage(
      this.ec,
      this.ec.initiator,
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
