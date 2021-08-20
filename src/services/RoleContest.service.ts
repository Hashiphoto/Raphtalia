import dayjs from "dayjs";
import {
  Guild as DsGuild,
  GuildMember,
  MessageEmbed,
  Role as DsRole,
  TextChannel,
} from "discord.js";
import { inject, injectable } from "tsyringe";
import { Result } from "../enums/Result";
import RaphError from "../models/RaphError";
import RoleContest from "../models/RoleContest";
import RoleContestBid from "../models/RoleContestBid";
import RoleRepository from "../repositories/Role.repository";
import { Format, print } from "../utilities/Util";
import ChannelService from "./Channel.service";
import MemberService from "./Member.service";
import RoleService from "./Role.service";

@injectable()
export default class RoleContestService {
  public constructor(
    @inject(RoleRepository) private _roleRepository: RoleRepository,
    @inject(RoleService) private _roleService: RoleService,
    @inject(ChannelService) private _channelService: ChannelService,
    @inject(MemberService) private _memberService: MemberService
  ) {}

  public async startContest(
    contestedRole: DsRole,
    previousRole: DsRole,
    initiator: GuildMember,
    channel: TextChannel
  ): Promise<void> {
    const content =
      `**${
        initiator.displayName
      } is contesting a promotion into the ${contestedRole.toString()} role!**\n` +
      `🔸 ${
        initiator.displayName
      } and everyone who currently holds the ${contestedRole.toString()} role can give me money to keep the role.\n` +
      `🔸 Whoever gives the least amount of money by the end of the contest period will be demoted.\n` +
      `🔸 Contests are resolved at 8PM every day, if at least 24 hours have passed since the start of the contest.\n` +
      `🔸 Use the command \`!Give @Raphtalia $1.00\` to pay me\n`;

    const embed = await this.getStatusEmbed(contestedRole);

    const message = await channel.send({ content, embed });

    await this._roleRepository.insertRoleContest(
      contestedRole.id,
      previousRole.id,
      initiator.id,
      new Date(),
      message.id
    );
  }

  public async bidOnRoleContest(
    role: DsRole,
    member: GuildMember,
    amount: number
  ): Promise<RoleContest | undefined> {
    const roleContest = await this._roleRepository.findRoleContest(role.id, member.id);
    if (!roleContest) {
      return;
    }
    await this._roleRepository.insertContestBid(roleContest.id, member.id, amount);
    const updatedRoleContest = await this._roleRepository.getRoleContest(roleContest.id, true);
    if (!updatedRoleContest) {
      throw new RaphError(Result.NotFound);
    }
    const contestStatusMessage = await this._channelService.fetchMessage(
      role.guild,
      updatedRoleContest.messageId
    );
    if (contestStatusMessage) {
      contestStatusMessage.edit({ embed: await this.getStatusEmbed(role, updatedRoleContest) });
    }

    return updatedRoleContest;
  }

  public async resolveRoleContests(guild: DsGuild, force = false): Promise<string[]> {
    const allContests = await this._roleRepository.getAllContests(guild.id);

    // Get all contests over 24 hours old, or all of them when force
    const dueContests = allContests.filter((contest) =>
      force ? true : dayjs(contest.startDate).add(24, "hour").isBefore(dayjs())
    );

    const promises = dueContests.map(async (contest) => {
      const role = this._roleService.convertToRole(guild, contest.roleId);
      const contestor = guild.members.cache.get(contest.initiatorId);
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

      await this._roleRepository.deleteContest(contest.id).catch((e) => {
        console.log(e);
      });
      const contestStatusMessage = await this._channelService.fetchMessage(
        guild,
        contest.messageId
      );
      if (contestStatusMessage) {
        await contestStatusMessage.delete();
      }
      const punishFeedback = await this.punishContestLoser(contestor, loserBid, role);

      return (
        `**The contest for the ${role.toString()} role is over!**\n` +
        `The loser is ${loserBid.member.toString()} with a measly bid of ` +
        `${print(loserBid.amount, Format.Dollar)}!\n` +
        `${punishFeedback}\n\n`
      );
    });

    return Promise.all(promises);
  }

  private async punishContestLoser(
    contestor: GuildMember,
    loserBid: RoleContestBid,
    role: DsRole
  ): Promise<string> {
    // If the contestor loses, we can just demote him
    if (loserBid.userId === contestor.id) {
      return this._memberService.demoteMember(contestor);
    }
    // Initiator promoted to role. Loser demoted
    else {
      let feedback = await this._memberService.increaseMemberRank(contestor, role);
      feedback += await this._memberService.demoteMember(loserBid.member);

      return feedback;
    }
  }

  private async getStatusEmbed(role: DsRole, roleContest?: RoleContest) {
    let bids = undefined;

    if (roleContest) {
      bids = await roleContest.bids.reduce(async (sum, currentBid) => {
        const member = await role.guild.members.fetch(currentBid.userId);
        return (await sum) + `${member.displayName}: ${print(currentBid.amount, Format.Dollar)}\n`;
      }, Promise.resolve(""));
    }

    return new MessageEmbed()
      .setColor(role.color)
      .setThumbnail("https://i.imgur.com/W5yJcBQ.png")
      .addFields({ name: "Current Bids", value: bids ?? "None" });
  }
}
