import Admin from "./Admin";
import AllowWord from "./AllowWord";
import AutoDelete from "./AutoDelete";
import Balance from "./Balance";
import BanList from "./BanList";
import BanWord from "./BanWord";
import Buy from "./Buy";
import Censorship from "./Censorship";
import Command from "./Command";
import Debug from "./Debug";
import Exile from "./Exile";
import Give from "./Give";
import Headpat from "./Headpat";
import Help from "./Help";
import HoldVote from "./HoldVote";
import Infractions from "./Infractions";
import Pardon from "./Pardon";
import Play from "./Play";
import Poke from "./Poke";
import Promote from "./Promote";
import Register from "./Register";
import Revolt from "./Revolt";
import Roles from "./Roles";
import Scan from "./Scan";
import Screening from "./Screening";
import ServerStatus from "./ServerStatus";
import Status from "./Status";
import Steal from "./Steal";
import Store from "./Store";
import Take from "./Take";

export const AllCommands: Command[] = [
  new Admin(),
  new AllowWord(),
  new AutoDelete(),
  new Balance(),
  new BanList(),
  new BanWord(),
  new Buy(),
  new Censorship(),
  new Debug(),
  new Exile(),
  new Give(),
  new Headpat(),
  new Help(),
  new HoldVote(),
  new Infractions(),
  new Pardon(),
  new Play(),
  new Poke(),
  new Promote(),
  new Register(),
  new Revolt(),
  new Roles(),
  new Scan(),
  new Screening(),
  new ServerStatus(),
  new Status(),
  new Steal(),
  new Store(),
  new Take(),
];
