import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import sendTimedMessage from "../timedMessage.js";
import Util from "../Util.js";
import Question from "../structures/Question.js";
import VotingOption from "../structures/VotingOption.js";
import RNumber from "../structures/RNumber.js";
import RoleUtil from "../RoleUtil.js";
import delay from "delay";

class HoldVote extends Command {
  constructor(message) {
    super(message);
    this.instructions =
      "**HoldVote**\nSet up a vote for all registered voters. " +
      'Ballots will be sent to anyone with the "voter" role when the voting period starts. ' +
      "After using the initial command, you will be asked several additional questions to specify the parameters of the vote";
    this.usage = "Usage: `HoldVote (Ask your question here)`";
  }
  async execute() {
    let voters = this.getVoters();
    if (voters.size === 0) {
      return this.inputChannel.watchSend(
        `There are no registered voters. Use the Register command first.`
      );
    }

    const votePrompt = this.message.content.trim();
    if (votePrompt.length === 0) {
      return this.sendHelpMessage("Vote canceled. No question was specified");
    }

    // Get the voting options
    const optionsQuestion = new Question(
      "Please list the voting options, separated by a comma",
      ".*",
      60000
    );
    let optionsMessage = await sendTimedMessage(
      this.inputChannel,
      this.sender,
      optionsQuestion,
      true
    );

    let options = this.removeMentions(optionsMessage).split(",");
    let votingOptions = [];
    for (var i = 0; i < options.length; i++) {
      options[i] = options[i].trim();
      if (options[i].length == 0) {
        continue;
      }
      // Increase i by 1 to be more user-friendly
      votingOptions.push(new VotingOption(i + 1, options[i]));
    }
    if (votingOptions.size === 0) {
      return this.sendHelpMessage("Vote canceled. No voting options were specified");
    }

    // Get the time
    const timeQuestion = new Question("How long will voting be open? (e.g. `1h 30m`)", ".*", 60000);
    let timeContent = (await sendTimedMessage(this.inputChannel, this.sender, timeQuestion, true))
      .content;

    let duration = Util.parseTime(timeContent);
    let endDate = dayjs().add(duration);
    // Don't allow the time (in ms) to exceed Integer max value (a little more than 24 days)
    if (duration > 0x7fffffff) {
      duration = 0x7fffffff;
    }

    // Send out the voting ballots
    this.inputChannel
      .watchSend(`Voting begins now and ends at ${Util.formatDate(endDate)}`)
      .then(() => this.useItem());

    const ballot = this.constructBallot(votePrompt, votingOptions, endDate, duration);

    voters.forEach((voter) => {
      let dmChannel;
      voter
        .createDM()
        .then((channel) => {
          dmChannel = channel;
          return sendTimedMessage(dmChannel, voter, ballot, false);
        })
        .then((choice) => {
          let msg = `Thank you for your vote!`;
          if (dmChannel)
            msg += `\nResults will be announced in **${this.message.guild.name}/#${this.inputChannel.name}** when voting is closed`;
          dmChannel.send(msg);
          const selected = votingOptions.find((v) => v.id === parseInt(choice.content));
          selected.votes++;
          console.log(`${voter.displayName} voted for ${selected.body}`);
        })
        .catch(() => {
          console.log(`${voter.displayName} did not vote`);
          dmChannel.send(`Voting has closed.`);
        });
    });

    // Announce results
    delay(duration).then(() => {
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

      this.inputChannel.watchSend(finalResults);
    });
  }

  //TODO: Move logic into controller

  /**
   * @param {String} prompt
   * @param {VotingOption[]} votingOptions
   * @param {Number} duration
   * @returns {Question}
   */
  constructBallot(prompt, votingOptions, endDate, duration) {
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
      `**A vote is being held in ${this.message.guild.name}!**\n` +
      `Please vote for one of the options below by replying with the number of the choice.\n` +
      `Voting ends at ${Util.formatDate(endDate)}\n\n`;
    ballotText += `${prompt}\n-------------------------\n`;
    ballotText += textOptions;

    return new Question(ballotText, answersRegEx, duration);
  }

  /**
   * @param {Discord.Message} optionsMessage
   * @returns {String}
   */
  removeMentions(optionsMessage) {
    // Replace the mentions with their nicknames and tags
    let content = optionsMessage.content;
    for (const [id, user] of optionsMessage.mentions.users) {
      let re = new RegExp(`<@!?${id}>`);
      let plainText = user.tag;
      const member = this.guild.members.get(user.id);
      if (member && member.nickname) {
        plainText += ` (${member.nickname})`;
      }
      content = content.replace(re, plainText);
    }

    return content;
  }

  /**
   * @returns {Discord.Collection<Discord.GuildMember>}
   */
  getVoters() {
    const voterRole = this.guild.roles.find((r) => r.name === "Voter");
    if (!voterRole) {
      // Create it asyncrhonously
      this.guild.createRole({ name: "Voter", hoist: false, color: "#4cd692" });
      return new Map();
    }
    return voterRole.members;
  }

  /**
   * @param {String[]} input
   */
  findLongest(input) {
    var longest = 0;
    input.forEach((str) => {
      if (str.length > longest) {
        longest = str.length;
      }
    });

    return longest;
  }

  buildTable(votingOptions) {
    const longestName = this.findLongest(votingOptions.map((v) => v.body));
    const longestPercent = this.findLongest(votingOptions.map((v) => v.getPercentage()));

    let resultsMsg = "```";
    votingOptions.forEach((option) => {
      resultsMsg += `${this.fillString(option.body, longestName)} | ${this.fillString(
        option.getPercentage(),
        longestPercent
      )} | ${option.votes} votes\n`;
    });
    resultsMsg += "```";

    return resultsMsg;
  }

  fillString(str, length, fillChar = " ") {
    return str + fillChar.repeat(length - str.length);
  }

  getWinners(votingOptions) {
    let winners = [];
    winners.push(votingOptions[0]);
    for (let i = 1; i < votingOptions.length; i++) {
      if (votingOptions[i].votes == winners[0].votes) {
        winners.push(votingOptions[i]);
      }
    }
    return winners;
  }

  /**
   * @param {VotingOption[]} options
   */
  formatTieList(options) {
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

export default HoldVote;
