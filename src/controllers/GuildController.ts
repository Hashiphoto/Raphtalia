import GuildBasedController from "./Controller";
import ScreeningQuestion from "../structures/ScreeningQuestion";
import { TextChannel } from "discord.js";

export default class GuildController extends GuildBasedController {
  public static async clearChannel(channel: TextChannel) {
    let pinnedMessages = await channel.messages.fetchPinned();
    let fetched;
    do {
      fetched = await channel.messages.fetch({ limit: 100 });
      await channel.bulkDelete(fetched.filter((message) => !message.pinned));
    } while (fetched.size > pinnedMessages.size);
  }

  public async getLeaderRole() {
    // Sort highest to lowest and get the top
    return this.ec.guild.roles.cache
      .filter((role) => role.hoist && role.members.size > 0)
      .sort((a, b) => b.comparePositionTo(a))
      .first();
  }

  public async setCensorship(enable: boolean) {
    return this.ec.db.guilds.setCensorship(this.ec.guild.id, enable);
  }

  public async getScreeningQuestions() {
    return this.ec.db.guilds.getScreeningQuestions(this.ec.guild.id);
  }

  public async addScreeningQuestion(question: ScreeningQuestion) {
    return this.ec.db.guilds.insertScreeningQuestion(this.ec.guild.id, question);
  }

  public async deleteScreeningQuestion(questionId: number) {
    return this.ec.db.guilds.deleteScreeningQuestion(this.ec.guild.id, questionId);
  }
}
