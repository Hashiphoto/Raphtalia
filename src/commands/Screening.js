import Discord from "discord.js";
import GuildController from "../controllers/GuildController.js";
import Question from "../structures/Question.js";
import sendTimedMessage from "../timedMessage.js";
import Command from "./Command.js";
import BadParametersError from "../structures/errors/BadParametersError.js";

class Screening extends Command {
  /**
   *
   * @param {Discord.Message} message
   * @param {GuildController} guildController
   */
  constructor(message, guildController) {
    super(message);
    this.guildController = guildController;
    this.instructions =
      "**Screening**\nView, edit or delete the guild screening questions. " +
      "To view the current screening questions, use the `list` flag. This does not consume an item use.\n" +
      "To add a new screening question, use the `add` flag and answer the additional questions.\n" +
      "To remove a screening question, use the `delete` flag followed by the id of the screening question. The id can be obtained using the `list` flag";
    this.usage = "Usage: `Screening (list | add | delete id)`";
  }

  execute() {
    if (this.message.args.length === 0) {
      return this.sendHelpMessage();
    }

    switch (this.message.args[0].toLowerCase()) {
      case "list":
        return this.guildController.getScreeningQuestions().then((questions) => {
          if (questions.length === 0) {
            return this.inputChannel.watchSend("There are currently no screening questions");
          }
          const allQuestions = questions.reduce((sum, question) => sum + question, "");
          return this.inputChannel.watchSend(allQuestions);
        });

      case "add":
        return this.getNewQuestionDetails()
          .then((question) => this.guildController.addScreeningQuestion(question))
          .then(() => this.inputChannel.watchSend("New question added!"))
          .then(() => this.useItem())
          .catch((error) => {
            if (error instanceof BadParametersError) {
              return this.inputChannel.watchSend(
                "Invalid input. Adding new screening question aborted"
              );
            }
            throw error;
          });

      case "delete":
        if (this.message.args.length < 2) {
          return this.sendHelpMessage(
            "Please try again and specify the id of the question to delete"
          );
        }
        const id = this.message.args[1];
        return this.guildController.deleteScreeningQuestion(id).then((deleted) => {
          if (deleted) {
            return this.inputChannel.watchSend("Question deleted").then(() => this.useItem());
          }
          return this.inputChannel.watchSend(`There is no question with id ${id}`);
        });
    }
  }

  getNewQuestionDetails() {
    let question = new Question();
    return sendTimedMessage(
      this.inputChannel,
      this.message.member,
      new Question("What is the question they will be asked?", ".*", 120000)
    )
      .then((message) => (question.prompt = message.content))
      .then(() =>
        sendTimedMessage(
          this.inputChannel,
          this.message.member,
          new Question(
            "What is the acceptable answer to the question? (case-insensitive)",
            ".*",
            120000
          )
        )
      )
      .then((message) => (question.answer = message.content))
      .then(() =>
        sendTimedMessage(
          this.inputChannel,
          this.message.member,
          new Question(
            "How many milliseconds (ms) will they have to answer correctly?",
            ".*",
            120000
          )
        )
      )
      .then((message) => {
        const timeout = parseInt(message.content);
        if (isNaN(timeout)) {
          throw new BadParametersError();
        }
        question.timeout = timeout;
      })
      .then(() =>
        sendTimedMessage(
          this.inputChannel,
          this.message.member,
          new Question(
            "Should the user be ejected immediately after answering incorrectly? (yes/no)",
            "(yes|no)",
            120000
          )
        )
      )
      .then((message) => (question.strict = message.content.includes("yes")))
      .then(() => question);
  }
}

export default Screening;
