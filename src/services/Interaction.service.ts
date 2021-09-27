import { Interaction, MessageComponentInteraction } from "discord.js";
import { InteractionMap, RaphtaliaInteraction } from "../enums/Interactions";

import { injectable } from "tsyringe";

@injectable()
export default class InteractionService {
  public async handleInteraction(interaction: Interaction): Promise<void> {
    if (interaction.type === "MESSAGE_COMPONENT") {
      const messageComponentInteraction = interaction as MessageComponentInteraction;

      const customIdParts = messageComponentInteraction.customId.split("|");

      const enumValue = customIdParts[0] as RaphtaliaInteraction;
      const interactionHandler = InteractionMap[enumValue];
      if (interactionHandler) {
        try {
          return interactionHandler(interaction, customIdParts.slice(1));
        } catch (e) {
          console.error(e);
          messageComponentInteraction.reply("Something went wrong!");
        }
      }
    }
  }
}
