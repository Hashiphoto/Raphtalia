import ScreeningQuestion from "../structures/ScreeningQuestion.js";
import GuildBasedController from "./GuildBasedController.js";

class GuildController extends GuildBasedController {
  // TODO: Move to a ChannelController class?
  static async clearChannel(channel) {
    let pinnedMessages = await channel.fetchPinnedMessages();
    let fetched;
    do {
      fetched = await channel.fetchMessages({ limit: 100 });
      await channel.bulkDelete(fetched.filter((message) => !message.pinned));
    } while (fetched.size > pinnedMessages.size);
  }

  getLeaderRole(guild) {
    return guild.roles
      .filter((role) => role.hoist && role.members.size > 0)
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .first();
  }

  setCensorship(enable) {
    return this.db.guilds.setCensorship(this.guild.id, enable);
  }

  /**
   * @returns {Promise<ScreeningQuestion[]>}
   */
  getScreeningQuestions() {
    return this.db.guilds.getScreeningQuestions(this.guild.id);
  }

  /**
   * @param {ScreeningQuestion} question
   */
  addScreeningQuestion(question) {
    return this.db.guilds.insertScreeningQuestion(this.guild.id, question);
  }

  /**
   * @param {Number} questionId
   */
  deleteScreeningQuestion(questionId) {
    return this.db.guilds.deleteScreeningQuestion(this.guild.id, questionId);
  }
}

export default GuildController;
