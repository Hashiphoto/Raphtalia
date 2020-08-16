import Discord from "discord.js";
import db from "./db/Database.js";
import sendTimedMessage from "./util/timedMessage.js";
import welcomeQuestions from "../resources/welcomeQuestions.js";
import { setHoistedRole } from "./util/roleManagement.js";
import { softkickMember } from "./util/guildManagement.js";
import discordConfig from "../config/discord.config.js";
import Question from "./structures/Question.js";

class Onboarder {
  /**
   * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry,
   * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
   * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge).
   * If they do, they are made a comrade. If they don't, they are softkicked
   *
   * @param {Discord.TextChannel} channel - The channel to send messages in
   * @param {Discord.GuildMember} member - The guildMember that is being onboarded
   */
  async onBoard(member, channel) {
    await setHoistedRole(member, discordConfig().roles.immigrant);

    let dbUser = await db.users.get(member.id, member.guild.id);

    // Check if already a citizen
    if (dbUser.citizenship) {
      channel.watchSend(`Welcome back ${member}!`);
      setHoistedRole(member, discordConfig().roles.neutral);
      return;
    }

    channel.watchSend(
      `Welcome ${member} to ${channel.guild.name}!\n` +
        `I have a few questions for you. If you answer correctly, you will be granted citizenship.`
    );

    // Set nickname
    try {
      let nickname = (
        await sendTimedMessage(channel, member, welcomeQuestions.nickname)
      ).content;
      // TODO: Disallow banned words from being in nickname
      // if (await censorship.containsBannedWords(channel.guild.id, nickname)) {
      //   softkickMember(
      //     channel,
      //     member,
      //     "We don't allow those words around here"
      //   );
      //   return;
      // }
      channel.watchSend(`${member.displayName} will be known as ${nickname}!`);
      member.setNickname(nickname).catch((e) => {
        console.error(e);
        channel.watchSend(
          `Sorry. I don't have permissions to set your nickname...`
        );
      });
    } catch (e) {
      console.error(e);
      channel.watchSend(`${member} doesn't want a nickname...`);
    }

    for (let i = 0; i < welcomeQuestions.gulagQuestions.length; i++) {
      let answeredCorrect = await this.askGateQuestion(
        channel,
        member,
        welcomeQuestions.gulagQuestions[i]
      );
      if (!answeredCorrect) {
        return;
      }
    }

    // Creates the user in the DB if they didn't exist
    db.users.setCitizenship(member.id, member.guild.id, true);
    channel
      .watchSend(
        `Thank you! And welcome loyal citizen to ${channel.guild.name}! 🎉🎉🎉`
      )
      .then(() => {
        setHoistedRole(member, discordConfig().roles.neutral);
      });
  }

  /**
   * Sends the timed message, but also kicks them if they answer incorrectly or include a censored word
   */
  async askGateQuestion(channel, member, question) {
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
      let response = (await sendTimedMessage(channel, member, questionCopy))
        .content;

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
      softkickMember(
        channel,
        member,
        "Come join the Gulag when you're feeling more agreeable."
      );
      return false;
    }
  }
}

export default Onboarder;
