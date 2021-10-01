import { Interaction } from "discord.js";
import Poke from "../commands/Poke";

export enum RaphtaliaInteraction {
  // MessageComponents
  ButtonPokeBack = "ButtonPokeBack",

  // Commands (have to be lower case)
  Poke = "poke",
}

export const InteractionMap: {
  [interaction in RaphtaliaInteraction]: (interaction: Interaction, args?: string[]) => void;
} = {
  // MessageComponents
  [RaphtaliaInteraction.ButtonPokeBack]: new Poke().pokeBack,

  // Commands
  [RaphtaliaInteraction.Poke]: new Poke().poke,
};
