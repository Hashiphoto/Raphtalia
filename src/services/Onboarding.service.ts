import delay from "delay";
import { GuildMember, Message, PartialGuildMember, TextChannel } from "discord.js";
import { inject, injectable } from "tsyringe";
import discordConfig from "../config/discord.config";
import { Result } from "../enums/Result";
import Question from "../models/Question";
import RaphError from "../models/RaphError";
import ScreeningQuestion from "../models/ScreeningQuestion";
import UserRepository from "../repositories/User.repository";
import ChannelService from "./Channel.service";
import GuildService from "./Guild.service";
import InventoryService from "./Inventory.service";
import MemberService from "./Member.service";

const messageSpacing = 800;

@injectable()
export default class OnboardingService {
  public constructor(
    @inject(MemberService) private _memberService: MemberService,
    @inject(ChannelService) private _channelService: ChannelService,
    @inject(UserRepository) private _userRepository: UserRepository,
    @inject(InventoryService) private _inventoryService: InventoryService,
    @inject(GuildService) private _guildService: GuildService
  ) {}

  /**
   * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry,
   * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
   * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge).
   * If they do, they are made a comrade. If they don't, they are softkicked
   */
  public async onBoard(member: GuildMember): Promise<void | string | Message> {
    const channel = member.guild.systemChannel;

    if (!channel) {
      throw new RaphError(Result.NotFound, "There is no system channel set for the guild");
    }

    if (member.user.bot) {
      await this._channelService.watchSend(channel, {
        content: `Welcome fellow bot, ${member.displayName}, to ${member.guild.name}! 🎉🎉🎉`,
      });
      return;
    }

    await this._memberService.setHoistedRole(member, discordConfig().roles.immigrant);
    await this._channelService.watchSend(channel, {
      content:
        `Welcome ${member.toString()} to ${member.guild.name}!\n` +
        `I have a few questions for you. If you answer correctly, you will be granted citizenship.`,
    });

    await this.setNickname(member, channel);

    const passedScreening = await this.screen(member, channel);
    if (!passedScreening) {
      return delay(2100)
        .then(() => this._channelService.watchSend(channel, { content: "😠" }))
        .then(() => delay(300))
        .then(() => this._memberService.softKick(member, "for answering a question wrong"))
        .then((feedback) => this._channelService.watchSend(channel, { content: feedback }));
    }

    // Creates the user in the DB if they didn't exist
    return this._userRepository
      .setCitizenship(member.id, member.guild.id, true)
      .then(() =>
        this._channelService.watchSend(channel, {
          content: `Thank you! And welcome loyal citizen to ${member.guild.name}! 🎉🎉🎉`,
        })
      )
      .then(() => this._memberService.setHoistedRole(member, discordConfig().roles.neutral))
      .then(() => this._inventoryService.findGuildItem(member.guild.id, "Player Badge"))
      .then(async (playerBadge) => {
        if (playerBadge) {
          await this._inventoryService.userPurchase(member, playerBadge);
        }
      });
  }

  public async offboard(member: GuildMember | PartialGuildMember): Promise<void> {
    await this._userRepository.setCitizenship(member.id, member.guild.id, false);
  }

  private async setNickname(member: GuildMember, channel: TextChannel) {
    // TODO: Disallow banned words in the nickname
    const message = await this._channelService
      .sendTimedMessage(
        channel,
        member,
        new Question("What do you want to be called?", ".*", 60000)
      )
      .catch((collectedMessages) => {
        if (collectedMessages.size === 0) {
          return this._channelService.watchSend(channel, {
            content: `${member.toString()} doesn't want a nickname`,
          });
        }
      });
    if (!message) {
      return this._channelService.watchSend(channel, {
        content: `${member.toString()} doesn't want a nickname`,
      });
    }

    const nickname = message.content;
    const oldName = member.displayName;
    return member
      .setNickname(nickname)
      .then(() =>
        this._channelService.watchSend(channel, {
          content: `${oldName} will be known as ${nickname}!`,
        })
      )
      .catch((error) => {
        if (error.name === "DiscordAPIError" && error.message === "Missing Permissions") {
          return this._channelService.watchSend(channel, {
            content: "I don't have high enough permissions to set your nickname",
          });
        }
        return this._channelService.watchSend(channel, {
          content: "Something went wrong. No nickname for you",
        });
      });
  }

  private async screen(member: GuildMember, channel: TextChannel) {
    const screeningQuestions = await this._guildService.getScreeningQuestions(member.guild.id);
    for (let i = 0; i < screeningQuestions.length; i++) {
      const answeredCorrect = await delay(messageSpacing).then(() =>
        this.askGateQuestion(member, channel, screeningQuestions[i])
      );

      if (!answeredCorrect) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sends the timed message
   *
   * Returns whether they should be kicked or not
   */
  private async askGateQuestion(
    member: GuildMember,
    channel: TextChannel,
    question: ScreeningQuestion
  ): Promise<boolean> {
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
    let message: Message | undefined;
    try {
      message = await this._channelService.sendTimedMessage(channel, member, questionCopy);
    } catch (e) {
      // catch timeout error
      return false;
    }
    if (!message) {
      return false;
    }
    const response = message.content;

    // For strict questions, kick them if they answer wrong
    if (question.strict) {
      const answerRe = new RegExp(question.answer, "gi");
      if (response.match(answerRe) == null) {
        return false;
      }
    }

    return true;
  }
}
