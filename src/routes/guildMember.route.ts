import { Client } from "discord.js";
import MemberService from "../services/Member.service";
import OnboardingService from "../services/Onboarding.service";
import { container } from "tsyringe";

export default (client: Client): void => {
  const memberService = container.resolve(MemberService);
  const onboardingService = container.resolve(OnboardingService);

  client.on("guildMemberAdd", async (member) => {
    onboardingService.onBoard(member);
  });

  client.on("guildMemberRemove", (member) => {
    onboardingService.offboard(member);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    memberService.handleMemberUpdate(oldMember, newMember);
  });
};
