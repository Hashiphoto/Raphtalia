import { GuildMember, MessageEmbed, Role } from "discord.js";

import GuildBasedController from "./Controller";
import RNumber from "../structures/RNumber";
import RoleContest from "../structures/RoleContest";
import RoleContestBid from "../structures/RoleContestBid";
import RoleUtil from "../RoleUtil";
import dayjs from "dayjs";

export default class RoleContestController extends GuildBasedController {
  public async startContest(contestedRole: Role, previousRole: Role, member: GuildMember) {
    const contestMessage =
      `**${this.ec.initiator.toString()} is contesting a promotion into the ${contestedRole.toString()} role!**\n` +
      `🔸 ${this.ec.initiator.toString()} and everyone who currently holds the ${contestedRole.toString()} role can give me money to keep the role.\n` +
      `🔸 Whoever gives the least amount of money by the end of the contest period will be demoted.\n` +
      `🔸 Contests are resolved at 8PM every day, if at least 24 hours have passed since the start of the contest.\n` +
      `🔸 Use the command \`!Give @Raphtalia $1.00\` to pay me\n`;
    const contestEmbed = await this.getStatusEmbed(contestedRole);

    const message = await this.ec.channelHelper.watchSend(contestMessage, { embed: contestEmbed });

    return this.ec.db.roles.insertRoleContest(
      contestedRole.id,
      previousRole.id,
      member.id,
      new Date(),
      message.id
    );
  }

  public async bidOnRoleContest(role: Role, member: GuildMember, amount: number) {
    const roleContest = await this.ec.db.roles.findRoleContest(role.id, member.id);
    if (!roleContest) {
      return;
    }
    await this.ec.db.roles.insertContestBid(roleContest.id, member.id, amount);
    const updatedRoleContest = await this.ec.db.roles.getRoleContest(roleContest.id, true);
    if (!updatedRoleContest) {
      return;
    }
    const contestStatusMessage = await this.ec.channelController.fetchMessage(
      updatedRoleContest.messageId
    );
    if (contestStatusMessage) {
      contestStatusMessage.edit({ embed: await this.getStatusEmbed(role, updatedRoleContest) });
    }

    return updatedRoleContest;
  }

  public async resolveRoleContests(force = false): Promise<string[]> {
    const allContests = await this.ec.db.roles.getAllContests(this.ec.guild.id);

    // Get all contests over 24 hours old, or all of them when force
    const dueContests = allContests.filter((contest) =>
      force ? true : dayjs(contest.startDate).add(24, "hour").isBefore(dayjs())
    );

    const promises = dueContests.map(async (contest) => {
      const role = RoleUtil.convertToRole(this.ec.guild, contest.roleId);
      const contestor = this.ec.guild.members.cache.get(contest.initiatorId);
      if (!role || !contestor) {
        return "";
      }
      const participants = role.members.array();
      participants.push(contestor);

      // If there are no bids, everyone loses
      const loserBid = contest.getLowestBid(participants);
      if (!loserBid) {
        return "There are no bids. Roles will remain the same";
      }

      await this.ec.db.roles.deleteContest(contest.id);
      const contestStatusMessage = await this.ec.channelController.fetchMessage(contest.messageId);
      if (contestStatusMessage) {
        await contestStatusMessage.delete();
      }
      const punishFeedback = await this.punishContestLoser(contestor, loserBid, role);

      return (
        `**The contest for the ${role.toString()} role is over!**\n` +
        `The loser is ${loserBid.member.toString()} with a measly bid of ` +
        `${RNumber.formatDollar(loserBid.amount)}!\n` +
        `${punishFeedback}\n\n`
      );
    });

    return Promise.all(promises);
  }

  private punishContestLoser(contestor: GuildMember, loserBid: RoleContestBid, role: Role) {
    // If the contestor loses, we can just demote him
    if (loserBid.userId === contestor.id) {
      return this.ec.memberController.demoteMember(contestor);
    }
    // Initiator promoted to role. Loser demoted
    else {
      return this.ec.memberController
        .promoteMember(contestor, role)
        .then((feedback) => this.ec.memberController.demoteMember(loserBid.member, feedback));
    }
  }

  private async getStatusEmbed(role: Role, roleContest?: RoleContest) {
    let bids = undefined;

    if (roleContest) {
      bids = await roleContest.bids.reduce(async (sum, currentBid) => {
        const member = await this.ec.guild.members.fetch(currentBid.userId);
        return (await sum) + `${member.displayName}: ${RNumber.formatDollar(currentBid.amount)}\n`;
      }, Promise.resolve(""));
    }

    return new MessageEmbed()
      .setColor(role.color)
      .setThumbnail("https://i.imgur.com/W5yJcBQ.png")
      .addFields({ name: "Current Bids", value: bids ?? "None" });
  }
}
