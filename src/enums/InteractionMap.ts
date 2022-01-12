import AllowWord from "../commands/public/AllowWord";
import Balance from "../commands/public/Balance";
import BanWord from "../commands/public/BanWord";
import Buy from "../commands/public/Buy";
import Censorship from "../commands/admin/Censorship";
import Exile from "../commands/public/Exile";
import Give from "../commands/public/Give";
import Headpat from "../commands/public/Headpat";
import Help from "../commands/public/Help";
import { Interaction } from "discord.js";
import Pardon from "../commands/public/Pardon";
import Play from "../commands/public/Play";
import Poke from "../commands/public/Poke";
import Poll from "../commands/public/Poll";
import Promote from "../commands/public/Promote";
import { RaphtaliaInteraction } from "./Interactions";
import Scan from "../commands/public/Scan";
import Screening from "../commands/admin/Screening";
import Status from "../commands/public/Status";
import Steal from "../commands/public/Steal";

export const InteractionMap: {
  [interaction in RaphtaliaInteraction]: (interaction: Interaction, args?: string[]) => void;
} = {
  // MessageComponents
  [RaphtaliaInteraction.ButtonPokeBack]: new Poke().pokeBack,

  // Commands
  [RaphtaliaInteraction.AllowWord]: new AllowWord().allowWord,
  [RaphtaliaInteraction.Balance]: new Balance().balance,
  [RaphtaliaInteraction.BanWord]: new BanWord().banWord,
  [RaphtaliaInteraction.Buy]: new Buy().buy,
  [RaphtaliaInteraction.Censorship]: new Censorship().censorship,
  [RaphtaliaInteraction.Exile]: new Exile().exile,
  [RaphtaliaInteraction.Give]: new Give().give,
  [RaphtaliaInteraction.Headpat]: new Headpat().headpat,
  [RaphtaliaInteraction.Help]: new Help().help,
  [RaphtaliaInteraction.Pardon]: new Pardon().pardon,
  [RaphtaliaInteraction.Play]: new Play().play,
  [RaphtaliaInteraction.Promote]: new Promote().promote,
  [RaphtaliaInteraction.Poll]: new Poll().poll,
  [RaphtaliaInteraction.Poke]: new Poke().poke,
  [RaphtaliaInteraction.Scan]: new Scan().scan,
  [RaphtaliaInteraction.Screening]: new Screening().screening,
  [RaphtaliaInteraction.Status]: new Status().status,
  [RaphtaliaInteraction.Steal]: new Steal().steal,
};
