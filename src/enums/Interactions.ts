import AllowWord from "../commands/AllowWord";
import { Interaction } from "discord.js";
import Play from "../commands/Play";
import Poke from "../commands/Poke";
import Status from "../commands/Status";

export enum RaphtaliaInteraction {
  // MessageComponents
  ButtonPokeBack = "ButtonPokeBack",

  // Commands (have to be lower case)
  AllowWord = "allow-word",
  Play = "play",
  Poke = "poke",
  Status = "status",
}

export const InteractionMap: {
  [interaction in RaphtaliaInteraction]: (interaction: Interaction, args?: string[]) => void;
} = {
  // MessageComponents
  [RaphtaliaInteraction.ButtonPokeBack]: new Poke().pokeBack,

  // Commands
  [RaphtaliaInteraction.AllowWord]: new AllowWord().allowWord,
  [RaphtaliaInteraction.Play]: new Play().play,
  [RaphtaliaInteraction.Poke]: new Poke().poke,
  [RaphtaliaInteraction.Status]: new Status().status,
};
