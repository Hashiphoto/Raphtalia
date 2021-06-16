import Discord, { GuildMember, Message } from "discord.js";

import ExecutionContext from "./structures/ExecutionContext";
import MemberController from "./controllers/MemberController";
import Question from "./structures/Question";
import ScreeningQuestion from "./structures/ScreeningQuestion";
import delay from "delay";
import discordConfig from "../config/discord.config";
import watchSendTimedMessage from "./TimedMessage";

const messageSpacing = 800;

export default class OnBoarder {
  private member: Discord.GuildMember;
  private ec: ExecutionContext;

  public constructor(context: ExecutionContext, member: GuildMember) {
    this.ec = context;
    this.member = member;
  }

  /**
   * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry,
   * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
   * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge).
   * If they do, they are made a comrade. If they don't, they are softkicked
   */
  public async onBoard(): Promise<void | string | Message> {
    const memberController = new MemberController(this.ec);
    await memberController.setHoistedRole(this.member, discordConfig().roles.immigrant);
    await this.ec.channelHelper.watchSend(
      `Welcome ${this.member.toString()} to ${this.ec.guild.name}!\n` +
        `I have a few questions for you. If you answer correctly, you will be granted citizenship.`
    );

    await this.setNickname();

    const passedScreening = await this.screen();
    if (!passedScreening) {
      return delay(2100)
        .then(() => this.ec.channelHelper.watchSend("😠"))
        .then(() => delay(300))
        .then(() => memberController.softKick(this.member, "for answering a question wrong"))
        .then((feedback) => this.ec.channelHelper.watchSend(feedback));
    }

    // Creates the user in the DB if they didn't exist
    return this.ec.db.users
      .setCitizenship(this.member.id, this.ec.guild.id, true)
      .then(() =>
        this.ec.channelHelper.watchSend(
          `Thank you! And welcome loyal citizen to ${this.ec.guild.name}! 🎉🎉🎉`
        )
      )
      .then(() => memberController.setHoistedRole(this.member, discordConfig().roles.neutral, true))
      .then(() => this.ec.db.inventory.findGuildItem(this.ec.guild.id, "Player Badge"))
      .then(async (playerBadge) => {
        if (playerBadge) {
          await this.ec.inventoryController.userPurchase(playerBadge, this.member);
        }
      });
  }

  private async setNickname() {
    // TODO: Disallow banned words in the nickname
    const message = await watchSendTimedMessage(
      this.ec,
      this.member,
      new Question("What do you want to be called?", ".*", 60000)
    ).catch((collectedMessages) => {
      if (collectedMessages.size === 0) {
        return this.ec.channelHelper.watchSend(`${this.member.toString()} doesn't want a nickname`);
      }
    });
    if (!message) {
      return this.ec.channelHelper.watchSend(`${this.member.toString()} doesn't want a nickname`);
    }

    const nickname = message.content;
    const oldName = this.member.displayName;
    return this.member
      .setNickname(nickname)
      .then(() => this.ec.channelHelper.watchSend(`${oldName} will be known as ${nickname}!`))
      .catch((error) => {
        if (error.name === "DiscordAPIError" && error.message === "Missing Permissions") {
          return this.ec.channelHelper.watchSend(
            "I don't have high enough permissions to set your nickname"
          );
        }
        return this.ec.channelHelper.watchSend("Something went wrong. No nickname for you");
      });
  }

  private async screen() {
    return this.ec.guildController.getScreeningQuestions().then(async (questions) => {
      for (let i = 0; i < questions.length; i++) {
        const answeredCorrect = await delay(messageSpacing).then(() =>
          this.askGateQuestion(questions[i])
        );

        if (!answeredCorrect) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sends the timed message
   *
   * Returns whether they should be kicked or not
   */
  private async askGateQuestion(question: ScreeningQuestion) {
    try {
      // For strict questions, always take the first answer
      const questionCopy = new Question(
        question.prompt,
        question.answer,
        question.timeout,
        question.strict
      );
      if (question.strict) {
        questionCopy.answer = ".*";
      }

      // Wait until they supply an answer matching the question.answer regex
      const message = await watchSendTimedMessage(this.ec, this.member, questionCopy);
      if (!message) {
        throw new Error("No response given");
      }
      const response = message.content;

      // if (await censorship.containsBannedWords(member.guild.id, response)) {
      //   softkickMember(channel, member, "We don't allow those words here");
      //   return false;
      // }

      // For strict questions, kick them if they answer wrong
      if (question.strict) {
        const answerRe = new RegExp(question.answer, "gi");
        if (response.match(answerRe) == null) {
          throw new Error("Incorrect response given");
        }
      }

      return true;
    } catch (e) {
      // Catches timeout error (no response) and wrong answer on strict questions
      return false;
    }
  }
}
