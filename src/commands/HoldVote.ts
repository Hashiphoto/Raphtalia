import { Collection, GuildMember, Message } from "discord.js";
import watchSendTimedMessage, { sendTimedMessageInChannel } from "../TimedMessage.js";

import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import Question from "../structures/Question.js";
import RNumber from "../structures/RNumber.js";
import Util from "../Util.js";
import VotingOption from "../structures/VotingOption.js";
import dayjs from "dayjs";
import delay from "delay";

export default class HoldVote extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions =
      "**HoldVote**\nSet up a vote for all registered voters. " +
      'Ballots will be sent to anyone with the "voter" role when the voting period starts. ' +
      "After using the initial command, you will be asked several additional questions to specify the parameters of the vote";
    this.usage = "Usage: `HoldVote (Ask your question here)`";
  }

  public async execute(): Promise<any> {
    let voters = await this.getVoters();
    if (voters.size === 0) {
      return this.ec.channelHelper.watchSend(
        `There are no registered voters. Use the Register command first.`
      );
    }

    const votePrompt = this.ec.messageHelper.parsedContent.trim();
    if (votePrompt.length === 0) {
      return this.sendHelpMessage("Vote canceled. No question was specified");
    }

    // Get the voting options
    const optionsQuestion = new Question(
      "Please list the voting options, separated by a comma",
      ".*",
      60000
    );
    let optionsMessage = await watchSendTimedMessage(
      this.ec,
      this.ec.initiator,
      optionsQuestion,
      true
    );
    if (!optionsMessage) {
      return this.sendHelpMessage("Vote canceled. No options given");
    }

    let options = this.removeMentions(optionsMessage).split(",");
    let votingOptions = new Array<VotingOption>();
    for (var i = 0; i < options.length; i++) {
      options[i] = options[i].trim();
      if (options[i].length == 0) {
        continue;
      }
      // Increase i by 1 to be more user-friendly
      votingOptions.push(new VotingOption(i + 1, options[i]));
    }
    if (votingOptions.length === 0) {
      return this.sendHelpMessage("Vote canceled. No voting options were specified");
    }

    // Get the time
    const timeQuestion = new Question("How long will voting be open? (e.g. `1h 30m`)", ".*", 60000);
    const message = await watchSendTimedMessage(this.ec, this.ec.initiator, timeQuestion, true);
    if (!message) {
      return this.ec.channelHelper.watchSend(`No response. Vote canceled`);
    }
    let timeContent = message.content;

    let duration = Util.parseTime(timeContent);
    if (!duration) {
      return this.ec.channelHelper.watchSend(`Could not understand time format. Vote canceled`);
    }
    let endDate = dayjs().add(duration);
    // Don't allow the time (in ms) to exceed Integer max value (a little more than 24 days)
    if (duration > 0x7fffffff) {
      duration = 0x7fffffff;
    }

    // Send out the voting ballots asyncrhonously
    const ballot = this.constructBallot(votePrompt, votingOptions, endDate, duration);
    this.distributeBallots(voters, votingOptions, ballot);

    // Announce results asynchronously
    delay(duration).then(() => this.announceResults(votingOptions));

    return this.ec.channelHelper
      .watchSend(`Voting begins now and ends at ${Util.formatDate(endDate)}`)
      .then(() => this.useItem());
  }

  private distributeBallots(
    voters: Collection<string, GuildMember>,
    votingOptions: VotingOption[],
    ballot: Question
  ) {
    voters.forEach(async (voter) => {
      const dmChannel = await voter.createDM();
      sendTimedMessageInChannel(dmChannel, voter, ballot, false)
        .then((choice) => {
          if (!choice) {
            throw Error;
          }
          const selected = votingOptions.find((v) => v.id === parseInt(choice.content));
          if (selected) {
            dmChannel.send(
              `Thank you for your vote!\nResults will be announced in **${this.ec.guild.name}/#${this.ec.channel.name}** when voting is closed`
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
    let winners = this.getWinners(votingOptions);
    let finalResults = "Voting is done!\n";

    if (winners.length > 1) {
      let tieList = this.formatTieList(votingOptions);
      finalResults += `**There is a ${winners.length}-way tie between ${tieList}** `;
    } else {
      finalResults += `**The winner is ${votingOptions[0].body.toUpperCase()}** `;
    }
    finalResults += `with ${RNumber.formatPercent(
      totalVotes ? winners[0].votes / totalVotes : 0
    )} of the vote \n${resultsTable}`;

    this.ec.channelHelper.watchSend(finalResults);
  }

  private constructBallot(
    prompt: string,
    votingOptions: VotingOption[],
    endDate: dayjs.Dayjs,
    duration: number
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
      `**A vote is being held in ${this.ec.guild.name}!**\n` +
      `Please vote for one of the options below by replying with the number of the choice.\n` +
      `Voting ends at ${Util.formatDate(endDate)}\n\n`;
    ballotText += `${prompt}\n-------------------------\n`;
    ballotText += textOptions;

    return new Question(ballotText, answersRegEx, duration);
  }

  private removeMentions(optionsMessage: Message) {
    // Replace the mentions with their nicknames and tags
    let content = optionsMessage.content;
    for (const [id, user] of optionsMessage.mentions.users) {
      let re = new RegExp(`<@!?${id}>`);
      let plainText = user.tag;
      const member = this.ec.guild.members.cache.get(user.id);
      if (member && member.nickname) {
        plainText += ` (${member.nickname})`;
      }
      content = content.replace(re, plainText);
    }

    return content;
  }

  private async getVoters(): Promise<Collection<string, GuildMember>> {
    const voterRole = this.ec.guild.roles.cache.find((r) => r.name === "Voter");
    if (!voterRole) {
      // Create it asyncrhonously
      await this.ec.guild.roles.create({ data: { name: "Voter", hoist: false, color: "#4cd692" } });
      return new Collection();
    }
    return voterRole.members;
  }

  private findLongest(input: string[]) {
    var longest = 0;
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
    let winners = [];
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
