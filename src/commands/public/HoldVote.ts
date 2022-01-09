import { Collection, Guild as DsGuild, GuildMember, Message, TextChannel } from "discord.js";
import { Format, formatDate, parseDuration, print } from "../../utilities/Util";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { Duration } from "dayjs/plugin/duration";
import { IArgProps } from "../../interfaces/CommandInterfaces";
import Question from "../../models/Question";
import RaphError from "../../models/RaphError";
import { Result } from "../../enums/Result";
import VotingOption from "../../models/VotingOption";
import { autoInjectable } from "tsyringe";
import dayjs from "dayjs";
import delay from "delay";

/**
 * @deprecated
 */
@autoInjectable()
export default class HoldVote extends Command<IArgProps> {
  public constructor() {
    super();
    this.name = "HoldVote";
    this.instructions =
      "Set up a vote for all registered voters. " +
      'Ballots will be sent to anyone with the "voter" role when the voting period starts. ' +
      "After using the initial command, you will be asked several additional questions to specify the parameters of the vote";
    this.usage = "`HoldVote (Ask your question here)`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    const votePrompt = cmdMessage.parsedContent;
    if (votePrompt.length === 0) {
      await this.sendHelpMessage("Vote canceled. No question was specified");
      return;
    }

    await this.runWithItem({ initiator: cmdMessage.message.member, arg: votePrompt });
  }

  public async execute({ initiator, arg: votePrompt }: IArgProps): Promise<number | undefined> {
    if (!((this.channel as TextChannel)?.type === "GUILD_TEXT")) {
      return;
    }
    const voters = await this.getVoters(initiator.guild);
    if (voters.size === 0) {
      await this.reply(`There are no registered voters. Use the Register command first.`);
      return;
    }

    // Get the voting options
    const optionsQuestion = new Question(
      "Please list the voting options, separated by a comma",
      ".*",
      60000
    );
    const optionsMessage = await this.channelService?.sendTimedMessage(
      this.channel as TextChannel,
      initiator,
      optionsQuestion,
      true
    );
    if (!optionsMessage) {
      await this.sendHelpMessage("Vote canceled. No options given");
      return;
    }

    const options = this.removeMentions(initiator.guild, optionsMessage).split(",");
    const votingOptions: VotingOption[] = [];
    for (let i = 0; i < options.length; i++) {
      options[i] = options[i].trim();
      if (options[i].length == 0) {
        continue;
      }
      // Increase i by 1 to be more user-friendly
      votingOptions.push(new VotingOption(i + 1, options[i]));
    }
    if (votingOptions.length === 0) {
      await this.sendHelpMessage("Vote canceled. No voting options were specified");
      return;
    }

    // Get the time
    const timeQuestion = new Question("How long will voting be open? (e.g. `1h 30m`)", ".*", 60000);
    const message = await this.channelService?.sendTimedMessage(
      this.channel as TextChannel,
      initiator,
      timeQuestion,
      true
    );
    if (!message) {
      await this.reply(`No response. Vote canceled`);
      return;
    }
    const timeContent = message.content;

    let duration = parseDuration(timeContent);
    if (!duration) {
      await this.reply(`Could not understand time format. Vote canceled`);
      return;
    }
    const endDate = dayjs().add(duration);
    // Don't allow the time (in ms) to exceed Integer max value (a little more than 24 days)
    if (duration.days() > 24) {
      duration = dayjs.duration(24, "days");
    }

    // Send out the voting ballots asyncrhonously
    const ballot = this.constructBallot(
      initiator.guild,
      votePrompt,
      votingOptions,
      endDate,
      duration
    );
    this.distributeBallots(initiator.guild, voters, votingOptions, ballot);

    // Announce results asynchronously
    delay(duration.asMilliseconds()).then(() => this.announceResults(votingOptions));

    await this.channelService?.watchSend(this.channel, {
      content: `Voting begins now and ends at ${formatDate(endDate)}`,
    });
    return 1;
  }

  private async distributeBallots(
    guild: DsGuild,
    voters: Collection<string, GuildMember>,
    votingOptions: VotingOption[],
    ballot: Question
  ) {
    const distributePromises = voters.map(async (voter) => {
      const dmChannel = await voter.createDM();
      return this.channelService
        ?.sendTimedMessage(dmChannel, voter, ballot, false)
        .then((choice) => {
          if (!choice) {
            throw Error;
          }
          const selected = votingOptions.find((v) => v.id === parseInt(choice.content));
          if (selected) {
            dmChannel.send(
              `Thank you for your vote!\nResults will be announced in **${guild.name}/#${
                (this.channel as TextChannel).name
              }** when voting is closed`
            );
            selected.votes++;
            console.log(`${voter.displayName} voted for ${selected.body}`);
          } else {
            dmChannel.send(`Sorry, "${choice.content}" wasn't the number of an option`);
          }
        })
        .catch(() => {
          console.log(`${voter.displayName} did not vote`);
          dmChannel.send(`Voting has closed.`);
        });
    });
    return Promise.all(distributePromises);
  }

  private announceResults(votingOptions: VotingOption[]) {
    let totalVotes = 0;

    // Sort results from most votes to least
    votingOptions.sort(function (a, b) {
      return b.votes - a.votes;
    });
    // Get total number of votes
    votingOptions.forEach((option) => {
      totalVotes += option.votes;
    });
    votingOptions.forEach((option) => {
      option.totalVotes = totalVotes;
    });

    // Format results into table
    const resultsTable = this.buildTable(votingOptions);

    // Announce final results
    const winners = this.getWinners(votingOptions);
    let finalResults = "Voting is done!\n";

    if (winners.length > 1) {
      const tieList = this.formatTieList(votingOptions);
      finalResults += `**There is a ${winners.length}-way tie between ${tieList}** `;
    } else {
      finalResults += `**The winner is ${votingOptions[0].body.toUpperCase()}** `;
    }
    finalResults += `with ${print(
      totalVotes ? winners[0].votes / totalVotes : 0,
      Format.Percent
    )} of the vote \n${resultsTable}`;

    this.reply(finalResults);
  }

  private constructBallot(
    guild: DsGuild,
    prompt: string,
    votingOptions: VotingOption[],
    endDate: dayjs.Dayjs,
    duration: Duration
  ) {
    let textOptions = "";
    let answersRegEx = "^(";
    for (let i = 0; i < votingOptions.length; i++) {
      textOptions += votingOptions[i].toString();
      if (i === votingOptions.length - 1) {
        answersRegEx += votingOptions[i].id;
      } else {
        answersRegEx += votingOptions[i].id + "|";
      }
    }
    answersRegEx += ")$";

    let ballotText =
      `**A vote is being held in ${guild.name}!**\n` +
      `Please vote for one of the options below by replying with the number of the choice.\n` +
      `Voting ends at ${formatDate(endDate)}\n\n`;
    ballotText += `${prompt}\n-------------------------\n`;
    ballotText += textOptions;

    return new Question(ballotText, answersRegEx, duration.asMilliseconds());
  }

  private removeMentions(guild: DsGuild, optionsMessage: Message) {
    // Replace the mentions with their nicknames and tags
    let content = optionsMessage.content;
    for (const [id, user] of optionsMessage.mentions.users) {
      const re = new RegExp(`<@!?${id}>`);
      let plainText = user.tag;
      const member = guild.members.cache.get(user.id);
      if (member && member.nickname) {
        plainText += ` (${member.nickname})`;
      }
      content = content.replace(re, plainText);
    }

    return content;
  }

  private async getVoters(guild: DsGuild): Promise<Collection<string, GuildMember>> {
    const voterRole = guild.roles.cache.find((r) => r.name === "Voter");
    if (!voterRole) {
      // Create it asyncrhonously
      await guild.roles.create({ name: "Voter", hoist: false, color: "#4cd692" });
      return new Collection();
    }
    return voterRole.members;
  }

  private findLongest(input: string[]) {
    let longest = 0;
    input.forEach((str) => {
      if (str.length > longest) {
        longest = str.length;
      }
    });

    return longest;
  }

  private buildTable(votingOptions: VotingOption[]) {
    const longestName = this.findLongest(votingOptions.map((v) => v.body));
    const longestPercent = this.findLongest(votingOptions.map((v) => v.getPercentage()));

    let resultsMsg = "```";
    votingOptions.forEach((option: VotingOption) => {
      resultsMsg += `${this.fillString(option.body, longestName)} | ${this.fillString(
        option.getPercentage(),
        longestPercent
      )} | ${option.votes} votes\n`;
    });
    resultsMsg += "```";

    return resultsMsg;
  }

  private fillString(str: string, length: number, fillChar = " ") {
    return str + fillChar.repeat(length - str.length);
  }

  private getWinners(votingOptions: VotingOption[]) {
    const winners = [];
    winners.push(votingOptions[0]);
    for (let i = 1; i < votingOptions.length; i++) {
      if (votingOptions[i].votes == winners[0].votes) {
        winners.push(votingOptions[i]);
      }
    }
    return winners;
  }

  private formatTieList(options: VotingOption[]) {
    let tieList = "";

    for (let i = 0; i < options.length; i++) {
      tieList += options[i].body.toUpperCase();
      if (i === options.length - 2) {
        tieList += ", and ";
      } else if (i < options.length - 1) {
        tieList += ", ";
      }
    }

    return tieList;
  }
}
