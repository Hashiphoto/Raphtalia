import Discord from "discord.js";
import sendTimedMessage from "./timedMessage.js";
import discordConfig from "../config/discord.config.js";
import Question from "./structures/Question.js";
import MemberController from "./controllers/MemberController.js";
import Database from "./db/Database.js";
import delay from "delay";
import GuildController from "./controllers/GuildController.js";
import InventoryController from "./controllers/InventoryController.js";
import GuildItem from "./structures/GuildItem.js";

const messageSpacing = 800;

class OnBoarder {
  /**
   * @param {Database} db
   * @param {Discord.Guild} guild
   * @param {Discord.GuildMember} member
   * @param {Discord.TextChannel} channel
   */
  constructor(db, guild, member, channel) {
    this.db = db;
    this.guild = guild;
    this.member = member;
    this.channel = channel;
  }

  /**
   * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry,
   * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
   * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge).
   * If they do, they are made a comrade. If they don't, they are softkicked
   */
  async onBoard() {
    const memberController = new MemberController(this.db, this.guild);
    await memberController.setHoistedRole(this.member, discordConfig().roles.immigrant);

    this.channel.watchSend(
      `Welcome ${this.member} to ${this.guild.name}!\n` +
        `I have a few questions for you. If you answer correctly, you will be granted citizenship.`
    );

    // Set nickname
    return this.setNickname()
      .then(() => this.screen())
      .then((passedScreening) => {
        if (!passedScreening) {
          return delay(2100)
            .then(() => this.channel.watchSend("😠"))
            .then(() => delay(300))
            .then(() => memberController.softKick(this.member, "for answering a question wrong"))
            .then((feedback) => this.channel.watchSend(feedback));
        }

        // Creates the user in the DB if they didn't exist
        return this.db.users
          .setCitizenship(this.member.id, this.guild.id, true)
          .then(() =>
            this.channel.watchSend(
              `Thank you! And welcome loyal citizen to ${this.guild.name}! 🎉🎉🎉`
            )
          )
          .then(() => memberController.setHoistedRole(this.member, discordConfig().roles.neutral))
          .then(() => this.db.inventory.findGuildItem(this.guild.id, "Player Badge"))
          .then((playerBadge) =>
            new InventoryController(this.db, this.guild).userPurchase(playerBadge, this.member)
          );
      });
  }

  /**
   * @returns {Promise<void>}
   */
  setNickname() {
    // TODO: Disallow banned words in the nickname
    return sendTimedMessage(
      this.channel,
      this.member,
      new Question("What do you want to be called?", ".*", 60000)
    )
      .then((message) => {
        const nickname = message.content;
        const oldName = this.member.displayName;
        return this.member
          .setNickname(nickname)
          .then(() => this.channel.watchSend(`${oldName} will be known as ${nickname}!`))
          .catch((error) => {
            if (error.name === "DiscordAPIError" && error.message === "Missing Permissions") {
              return this.channel.watchSend(
                "I don't have high enough permissions to set your nickname"
              );
            }
            throw error;
          });
      })
      .catch((collectedMessages) => {
        if (collectedMessages.size === 0) {
          return this.channel.watchSend(`${this.member} doesn't want a nickname`);
        }
      });
  }

  screen() {
    const guildController = new GuildController(this.db, this.guild);
    return guildController.getScreeningQuestions().then(async (questions) => {
      for (let i = 0; i < questions.length; i++) {
        let answeredCorrect = await delay(messageSpacing).then(() =>
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
   * Sends the timed message, but also kicks them if they answer incorrectly or include a censored word
   */
  async askGateQuestion(question) {
    try {
      // For strict questions, always take the first answer
      let questionCopy = new Question(
        question.prompt,
        question.answer,
        question.timeout,
        question.strict
      );
      if (question.strict) {
        questionCopy.answer = ".*";
      }

      // Wait until they supply an answer matching the question.answer regex
      let response = (await sendTimedMessage(this.channel, this.member, questionCopy)).content;

      // if (await censorship.containsBannedWords(member.guild.id, response)) {
      //   softkickMember(channel, member, "We don't allow those words here");
      //   return false;
      // }

      // For strict questions, kick them if they answer wrong
      if (question.strict) {
        let answerRe = new RegExp(question.answer, "gi");
        if (response.match(answerRe) == null) {
          throw new Error("Incorrect response given");
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}

export default OnBoarder;
