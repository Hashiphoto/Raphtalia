import { Interaction } from "discord.js";
import Poke from "../commands/Poke";

export enum RaphtaliaInteraction {
  COMMAND_POKE_BACK = "CommandPokeBack",
}

export const InteractionMap: {
  [interaction in RaphtaliaInteraction]: (interaction: Interaction, args: string[]) => void;
} = {
  [RaphtaliaInteraction.COMMAND_POKE_BACK]: new Poke().pokeBack,
};
