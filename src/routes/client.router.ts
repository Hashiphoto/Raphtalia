import { Client } from "discord.js";
import CurrencyService from "../services/Currency.service";
import InteractionService from "../services/Interaction.service";
import MemberService from "../services/Member.service";
import MessageService from "../services/Message.service";
import OnboardingService from "../services/Onboarding.service";
import { container } from "tsyringe";

export default (client: Client): void => {
  const messageService = container.resolve(MessageService);
  const memberService = container.resolve(MemberService);
  const onboardingService = container.resolve(OnboardingService);
  const interactionService = container.resolve(InteractionService);
  const currencyService = container.resolve(CurrencyService);

  client.on("messageCreate", async (message) => {
    messageService.handleGuildMessage(message);
  });

  client.on("guildMemberAdd", async (member) => {
    onboardingService.onBoard(member);
  });

  client.on("guildMemberRemove", (member) => {
    onboardingService.offboard(member);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    memberService.handleMemberUpdate(oldMember, newMember);
  });

  client.on("messageReactionAdd", (messageReaction, user) => {
    messageService.handleReactionAdd(messageReaction, user);
  });

  client.on("messageReactionRemove", (messageReaction, user) => {
    messageService.handleReactionRemove(messageReaction, user);
  });

  client.on("interactionCreate", (interaction) => {
    interactionService.handleInteraction(interaction);
  });

  client.on("voiceStateUpdate", (oldState, newState) => {
    // Payout if they join a voice channel
    if (!oldState.channel && newState.channel && newState.member) {
      currencyService.payoutInteraction(newState.member, new Date());
    }
  });
};
