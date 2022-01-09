import { CommandInteraction, Interaction, MessageComponentInteraction } from "discord.js";

import { InteractionMap } from "../enums/InteractionMap";
import { RaphtaliaInteraction } from "../enums/Interactions";
import { injectable } from "tsyringe";

@injectable()
export default class InteractionService {
  public async handleInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isMessageComponent()) {
      return this.handleMessageComponentInteraction(interaction as MessageComponentInteraction);
    } else if (interaction.isCommand()) {
      return this.handleCommandInteraction(interaction as CommandInteraction);
    } else {
      console.error(`Received unhandled interaction type ${interaction.type}`, interaction);
    }
  }

  private async handleMessageComponentInteraction(interaction: MessageComponentInteraction) {
    const customIdParts = interaction.customId.split("|");
    const enumValue = customIdParts[0] as RaphtaliaInteraction;
    const interactionHandler = InteractionMap[enumValue];
    if (interactionHandler) {
      try {
        return interactionHandler(interaction, customIdParts.slice(1));
      } catch (e) {
        console.error(e);
        const errorText = "Something went wrong!";
        interaction.replied || interaction.replied
          ? interaction.followUp(errorText)
          : interaction.reply(errorText);
      }
    }
  }

  private async handleCommandInteraction(interaction: CommandInteraction) {
    const enumValue = interaction.commandName as RaphtaliaInteraction;
    const interactionHandler = InteractionMap[enumValue];
    if (interactionHandler) {
      interactionHandler(interaction);
    } else {
      interaction.reply(`I don't know how to handle this command: ${interaction.commandName}`);
    }
  }
}
