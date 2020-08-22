import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import discordConfig from "../../config/discord.config.js";
import sendTimedMessage from "../controllers/timedMessage.js";
import { percentFormat } from "../controllers/format.js";
import { formatDate, parseTime } from "../controllers/format.js";
import Question from "../structures/Question.js";
import VotingOption from "../structures/VotingOption.js";

class HoldVote extends Command {
  async execute() {
    let voters = this.getVoters();
    if (voters.size === 0) {
      return this.inputChannel.watchSend(
        `There are no registered voters. Use the Register command first.`
      );
    }

    // Remove the command
    const votePrompt = this.message.content.trim();
    if (votePrompt.length === 0) {
      return this.inputChannel.watchSend(
        "Vote canceled. Example usage: `HoldVote What is your favorite color?`"
      );
    }

    // Get the voting options
    const optionsQuestion = new Question(
      "Please list the voting options, separated by a comma",
      ".*",
      60000
    );
    let optionsContent = (
      await sendTimedMessage(this.inputChannel, this.sender, optionsQuestion, true)
    ).content;

    let options = this.removeMentions(optionsContent).split(",");
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
      return this.inputChannel.watchSend(`No options entered. Vote canceled.`);
    }

    // Get the time
    const timeQuestion = new Question("How long will voting be open? (e.g. `1h 30m`)", ".*", 60000);
    let timeContent = (await sendTimedMessage(this.inputChannel, this.sender, timeQuestion, true))
      .content;
    let endDate = parseTime(timeContent);
    let duration = endDate.diff(dayjs());
    if (duration > 0x7fffffff) {
      duration = 0x7fffffff;
    }

    // Send out the voting ballots
    this.inputChannel.watchSend(`Voting begins now and ends at ${endDate.format(dateFormat)}`);

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
    setTimeout(() => {
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
        let tieList = this.formatTieList();
        finalResults += `**There is a ${winners.length}-way tie between ${tieList}** `;
      } else {
        finalResults += `**The winner is ${votingOptions[0].body.toUpperCase()}** `;
      }
      finalResults += `with ${percentFormat(
        winners[0].votes / totalVotes
      )}% of the vote \n${resultsTable}`;

      this.inputChannel.watchSend(finalResults);
    }, duration);
  }

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
      `Voting ends at ${endDate.format(dateFormat)}\n\n`;
    ballotText += `${prompt}\n-------------------------\n`;
    ballotText += textOptions;

    return new Question(ballotText, answersRegEx, duration);
  }

  /**
   * @param {String} text
   */
  removeMentions(text) {
    // Replace the mentions with their nicknames and tags
    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      let re = new RegExp(`<@!?${this.message.mentionedMembers[i].id}>`);
      let plainText = this.message.mentionedMembers[i].user.tag;
      if (this.message.mentionedMembers[i].nickname) {
        plainText += ` (${this.message.mentionedMembers[i].nickname})`;
      }
      text = text.replace(re, plainText);
    }

    return text;
  }

  /**
   * @returns {Discord.GuildMember[]}
   */
  getVoters() {
    return convertToRole(this.message.guild, discordConfig().roles.voter).members;
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

  formatTieList(list) {
    for (let i = 0; i < list.length; i++) {
      tieList += list[i].body.toUpperCase();
      if (i === list.length - 2) {
        tieList += ", and ";
      } else if (i < list.length - 1) {
        tieList += ", ";
      }
    }
  }
}

export default HoldVote;
